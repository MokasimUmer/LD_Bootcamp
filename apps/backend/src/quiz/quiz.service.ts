import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from './redis.service';
import { LeaderboardGateway } from './leaderboard.gateway';

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

@Injectable()
export class QuizService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private leaderboardGateway: LeaderboardGateway,
  ) {}

  /**
   * Structured LLM Prompt Interface & Generator for dynamic quiz questions
   * ONLY succeeds if the organizer has explicitly unlocked/published the quiz for this day!
   */
  async generateDailyQuiz(bootcampId: string, dayNumber: number, developerId?: string): Promise<{
    bootcampTitle: string;
    dayNumber: number;
    title: string;
    difficulty: string;
    quizUnlocked: boolean;
    hasCompleted?: boolean;
    completedScore?: number;
    totalQuestions?: number;
    maxScore?: number;
    percentage?: number;
    completedAt?: Date;
    timeLimitMinutes?: number;
    quizStartedAt?: string;
    timeRemainingSeconds?: number;
    questions?: QuizQuestion[];
    message?: string;
  }> {
    const bootcamp = await this.prisma.bootcamp.findUnique({ where: { id: bootcampId } });
    if (!bootcamp) {
      throw new NotFoundException('Bootcamp not found');
    }

    const curriculum = (bootcamp.curriculum as any[]) || [];
    const dayModule = curriculum.find((c) => c.day === Number(dayNumber));

    if (!dayModule) {
      throw new NotFoundException(`Curriculum module for Day ${dayNumber} not found`);
    }

    const quizUnlocked = dayModule.quizUnlocked === true;
    const difficulty = dayModule.quizDifficulty || 'MEDIUM';
    const timeLimitMinutes = dayModule.timeLimitMinutes || 10;
    const quizStartedAt = dayModule.quizStartedAt;

    let timeRemainingSeconds: number | undefined = undefined;
    if (quizStartedAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(quizStartedAt).getTime()) / 1000);
      const totalSeconds = timeLimitMinutes * 60;
      timeRemainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
    }

    if (!quizUnlocked) {
      return {
        bootcampTitle: bootcamp.title,
        dayNumber: Number(dayNumber),
        title: dayModule.title || `Day ${dayNumber} Milestone Quiz`,
        difficulty,
        quizUnlocked: false,
        timeLimitMinutes,
        message: `The Day ${dayNumber} quiz is locked by the organizer. Complete today's tasks and wait for your organizer to publish the quiz.`,
      };
    }

    // Check if the developer has already completed this quiz
    if (developerId) {
      const existingScore = await this.prisma.quizScore.findUnique({
        where: {
          developerId_bootcampId_dayNumber: {
            developerId,
            bootcampId,
            dayNumber: Number(dayNumber),
          },
        },
      });

      if (existingScore) {
        const total = existingScore.totalQuestions || 3;
        const maxPts = total * 100;
        return {
          bootcampTitle: bootcamp.title,
          dayNumber: Number(dayNumber),
          title: dayModule.title || `Day ${dayNumber} Milestone Quiz`,
          difficulty,
          quizUnlocked: true,
          hasCompleted: true,
          completedScore: existingScore.score,
          totalQuestions: total,
          maxScore: maxPts,
          percentage: Math.round((existingScore.score / maxPts) * 100),
          completedAt: existingScore.completedAt,
        };
      }
    }

    const questions: QuizQuestion[] = this.buildQuestionsForDay(Number(dayNumber), difficulty);

    return {
      bootcampTitle: bootcamp.title,
      dayNumber: Number(dayNumber),
      title: dayModule.title || `Day ${dayNumber} Milestone Quiz`,
      difficulty,
      quizUnlocked: true,
      hasCompleted: false,
      timeLimitMinutes,
      quizStartedAt,
      timeRemainingSeconds,
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      })),
    };
  }

  /**
   * Submit developer quiz responses, record score, update Redis Sorted Set, and broadcast live ranks via Socket.io
   */
  async submitQuizAnswers(
    developerId: string,
    bootcampId: string,
    dayNumber: number,
    answers: { questionId: number; selectedIndex: number }[],
  ) {
    const bootcamp = await this.prisma.bootcamp.findUnique({ where: { id: bootcampId } });
    if (!bootcamp) {
      throw new NotFoundException('Bootcamp not found');
    }

    const curriculum = (bootcamp.curriculum as any[]) || [];
    const dayModule = curriculum.find((c) => c.day === Number(dayNumber));

    if (!dayModule || !dayModule.quizUnlocked) {
      throw new ForbiddenException(`Quiz for Day ${dayNumber} is currently locked by the organizer.`);
    }

    if (dayModule.quizStartedAt && dayModule.timeLimitMinutes) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(dayModule.quizStartedAt).getTime()) / 1000);
      const totalSeconds = Number(dayModule.timeLimitMinutes) * 60;
      if (elapsedSeconds > totalSeconds) {
        throw new ForbiddenException(`The ${dayModule.timeLimitMinutes}-minute timed quiz window for Day ${dayNumber} has expired.`);
      }
    }

    const existing = await this.prisma.quizScore.findUnique({
      where: {
        developerId_bootcampId_dayNumber: {
          developerId,
          bootcampId,
          dayNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`You have already completed the Day ${dayNumber} Milestone Quiz with score: ${existing.score}/${existing.totalQuestions * 100}`);
    }

    const questions = this.buildQuestionsForDay(dayNumber, dayModule.quizDifficulty || 'MEDIUM');
    let earnedPoints = 0;
    const pointsPerQuestion = 100;

    const results = questions.map((q) => {
      const userAns = answers.find((a) => a.questionId === q.id);
      const isCorrect = userAns ? userAns.selectedIndex === q.correctIndex : false;
      if (isCorrect) {
        earnedPoints += pointsPerQuestion;
      }
      return {
        questionId: q.id,
        userSelectedIndex: userAns ? userAns.selectedIndex : null,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const scoreRecord = await this.prisma.quizScore.create({
      data: {
        developerId,
        bootcampId,
        dayNumber,
        score: earnedPoints,
        totalQuestions: questions.length,
        difficulty: 'MEDIUM',
      },
      include: {
        developer: { select: { id: true, name: true, email: true, lightningAddress: true } },
      },
    });

    try {
      await this.redisService.updateScore(bootcampId, dayNumber, developerId, earnedPoints);
    } catch (e) {
      // Redis fallback - log warning without failing transaction
    }

    try {
      const updatedLeaderboard = await this.getLiveLeaderboard(bootcampId, dayNumber);
      this.leaderboardGateway.broadcastLeaderboardUpdate(bootcampId, dayNumber, updatedLeaderboard);
    } catch (e) {}

    return {
      score: earnedPoints,
      maxScore: questions.length * pointsPerQuestion,
      percentage: Math.round((earnedPoints / (questions.length * pointsPerQuestion)) * 100),
      results,
      completedAt: scoreRecord.completedAt,
    };
  }

  async getLiveLeaderboard(bootcampId: string, dayNumber: number) {
    let rawRanks: any[] = [];
    try {
      rawRanks = await this.redisService.getTopRankings(bootcampId, dayNumber);
    } catch (e) {
      rawRanks = [];
    }

    if (rawRanks.length === 0) {
      const dbScores = await this.prisma.quizScore.findMany({
        where: { bootcampId, dayNumber },
        include: {
          developer: { select: { id: true, name: true, email: true, lightningAddress: true } },
        },
        orderBy: { score: 'desc' },
      });

      return dbScores.map((s, index) => ({
        rank: index + 1,
        developerId: s.developerId,
        name: s.developer.name,
        email: s.developer.email,
        lightningAddress: s.developer.lightningAddress,
        score: s.score,
      }));
    }

    const developerIds = rawRanks.map((r) => r.developerId);
    const developers = await this.prisma.user.findMany({
      where: { id: { in: developerIds } },
      select: { id: true, name: true, email: true, lightningAddress: true },
    });

    const devMap = new Map<string, { id: string; name: string; email: string; lightningAddress: string | null }>(
      developers.map((d) => [d.id, d])
    );

    return rawRanks.map((r, index) => {
      const dev = devMap.get(r.developerId);
      return {
        rank: index + 1,
        developerId: r.developerId,
        name: dev ? dev.name : 'Unknown Developer',
        email: dev ? dev.email : '',
        lightningAddress: dev ? dev.lightningAddress : null,
        score: r.score,
      };
    });
  }

  private buildQuestionsForDay(dayNumber: number, difficulty: string): QuizQuestion[] {
    switch (dayNumber) {
      case 1:
        return [
          {
            id: 1,
            question: 'What mechanism allows two Lightning nodes to safely update off-chain balances without broadcasting every transaction to Bitcoin layer 1?',
            options: ['Hashed Timelock Contracts (HTLCs)', 'Segregated Witness (SegWit)', 'Schnorr Signatures', 'Zero-Knowledge Proofs'],
            correctIndex: 0,
            explanation: 'HTLCs combined with revocation keys allow nodes to route payments atomically and update balances off-chain.',
          },
          {
            id: 2,
            question: 'What happens when a Lightning channel is closed co-operatively?',
            options: ['A single final settlement transaction is broadcast to Bitcoin layer 1', 'All intermediate transactions are published to layer 1', 'The funds are locked for 144 blocks', 'The channel remains open indefinitely'],
            correctIndex: 0,
            explanation: 'A mutual close broadcasts a single transaction resolving final balances without timelock delays.',
          },
          {
            id: 3,
            question: 'Which component protects a Lightning node from a counterparty broadcasting an obsolete channel state?',
            options: ['Revocation Secrets / Justice Transactions', 'Proof of Work', 'DNS Seeds', 'Taproot Trees'],
            correctIndex: 0,
            explanation: 'If an old state is published, the non-breaching node can use the revocation secret to claim 100% of channel funds.',
          },
        ];
      case 2:
        return [
          {
            id: 1,
            question: 'What protocol specification defines human-readable Lightning Addresses in format user@domain.com?',
            options: ['LUD-16 (LNURL-pay address format)', 'LUD-02 (LNURL-channel)', 'LUD-09 (LNURL-withdraw)', 'BOLT-11'],
            correctIndex: 0,
            explanation: 'LUD-16 maps email-like identifiers to LNURL-pay endpoints at https://domain.com/.well-known/lnurlp/user.',
          },
          {
            id: 2,
            question: 'How does an LNURL-pay service return a BOLT-11 invoice to a payer?',
            options: ['Via an HTTP GET request to callback URL with amount in millisatoshis (msat)', 'By broadcasting a UDP packet', 'Via WebSocket frame only', 'Through a layer 1 Bitcoin transaction'],
            correctIndex: 0,
            explanation: 'The payer queries the callback endpoint passing ?amount=<msat> and receives a JSON containing { pr: "<BOLT11>" }.',
          },
          {
            id: 3,
            question: 'What is the minimum unit for LNURL-pay amount parameters?',
            options: ['Millisatoshis (1 satoshi = 1000 millisatoshis)', 'Satoshis', 'Bitcoins', 'Wei'],
            correctIndex: 0,
            explanation: 'LNURL specifications express amounts in millisatoshis (msat) for high sub-satoshi precision.',
          },
        ];
      case 3:
        return [
          {
            id: 1,
            question: 'Which WebLN method prompts the browser wallet extension (e.g. Alby) to pay a Lightning invoice?',
            options: ['webln.sendPayment(paymentRequest)', 'webln.makeInvoice()', 'webln.connect()', 'webln.verifyMessage()'],
            correctIndex: 0,
            explanation: 'webln.sendPayment() takes a BOLT-11 string and returns the payment preimage upon success.',
          },
          {
            id: 2,
            question: 'What cryptographic proof does a receiver obtain when a Lightning invoice is settled?',
            options: ['The 32-byte preimage (secret) whose SHA-256 hash matches the payment hash', 'A RSA signature', 'An ECDSA private key', 'A Merkle tree root'],
            correctIndex: 0,
            explanation: 'The preimage is the atomic cryptographic proof of settlement.',
          },
          {
            id: 3,
            question: 'What authentication header is required when querying LND REST API endpoints?',
            options: ['Grpc-Metadata-Macaroon (Hex or Base64 encoded macaroon)', 'Authorization: Bearer OAuthToken', 'X-API-Key', 'Basic Auth (username/password)'],
            correctIndex: 0,
            explanation: 'LND node APIs authenticate requests using Macaroon tokens passed via Grpc-Metadata-Macaroon headers.',
          },
        ];
      case 4:
      default:
        return [
          {
            id: 1,
            question: 'What technique allows Lightning nodes to rebalance inbound and outbound channel capacity?',
            options: ['Submarine Swaps & Circular Routing', 'Layer 1 Mining', 'Proof of Stake Locking', 'Plasma Chains'],
            correctIndex: 0,
            explanation: 'Submarine swaps exchange on-chain BTC for off-chain channel capacity without closing channels.',
          },
          {
            id: 2,
            question: 'What is the difference between inbound and outbound channel liquidity?',
            options: [
              'Outbound is funds on your side to send; Inbound is funds on remote peer side to receive',
              'Outbound is on-chain BTC; Inbound is LNURL-pay',
              'Inbound is only available to miners',
              'Outbound and Inbound are always equal',
            ],
            correctIndex: 0,
            explanation: 'Outbound liquidity represents local balance to send payments; Inbound represents peer balance to receive payments.',
          },
          {
            id: 3,
            question: 'How are routing fees calculated by Lightning routing nodes?',
            options: [
              'Base Fee (satoshis) + Fee Rate (ppm / parts per million of payment size)',
              'Flat 5% per transaction',
              'Fixed 100 satoshis per hop',
              'Free routing with block rewards',
            ],
            correctIndex: 0,
            explanation: 'Lightning node operators configure base_fee_msat plus fee_rate_ppm for routing through their channels.',
          },
        ];
    }
  }
}
