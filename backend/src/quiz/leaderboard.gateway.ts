import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LeaderboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LeaderboardGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`WebSocket client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_bootcamp_leaderboard')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { bootcampId: string; dayNumber: number },
  ) {
    const room = `leaderboard:${payload.bootcampId}:${payload.dayNumber}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    return { event: 'joined', room };
  }

  /**
   * Broadcast live leaderboard update to all subscribed organizer & developer dashboards
   */
  broadcastLeaderboardUpdate(bootcampId: string, dayNumber: number, leaderboard: any[]) {
    const room = `leaderboard:${bootcampId}:${dayNumber}`;
    this.server.to(room).emit('leaderboard_update', {
      bootcampId,
      dayNumber,
      timestamp: new Date().toISOString(),
      leaderboard,
    });
  }
}
