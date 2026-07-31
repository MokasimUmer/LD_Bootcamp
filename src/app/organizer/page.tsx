"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import io, { Socket } from "socket.io-client";
import { Zap, Camera, Shield, Plus, Trophy, CheckCircle2, AlertCircle, ExternalLink, Star, DollarSign, Edit3, X, Lock, Unlock, BookOpen, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import axios from "axios";
const AFRICAN_COUNTRIES_FALLBACK = [
  { id: "dz", name: "Algeria", code: "DZ", cities: [{ id: "dz-1", name: "Algiers" }, { id: "dz-2", name: "Oran" }, { id: "dz-3", name: "Constantine" }, { id: "dz-4", name: "Annaba" }, { id: "dz-5", name: "Blida" }] },
  { id: "ao", name: "Angola", code: "AO", cities: [{ id: "ao-1", name: "Luanda" }, { id: "ao-2", name: "Huambo" }, { id: "ao-3", name: "Lobito" }, { id: "ao-4", name: "Benguela" }, { id: "ao-5", name: "Cabinda" }] },
  { id: "bj", name: "Benin", code: "BJ", cities: [{ id: "bj-1", name: "Porto-Novo" }, { id: "bj-2", name: "Cotonou" }, { id: "bj-3", name: "Parakou" }, { id: "bj-4", name: "Djougou" }, { id: "bj-5", name: "Bohicon" }] },
  { id: "bw", name: "Botswana", code: "BW", cities: [{ id: "bw-1", name: "Gaborone" }, { id: "bw-2", name: "Francistown" }, { id: "bw-3", name: "Molepolole" }, { id: "bw-4", name: "Maun" }, { id: "bw-5", name: "Serowe" }] },
  { id: "bf", name: "Burkina Faso", code: "BF", cities: [{ id: "bf-1", name: "Ouagadougou" }, { id: "bf-2", name: "Bobo-Dioulasso" }, { id: "bf-3", name: "Koudougou" }, { id: "bf-4", name: "Banfora" }] },
  { id: "bi", name: "Burundi", code: "BI", cities: [{ id: "bi-1", name: "Gitega" }, { id: "bi-2", name: "Bujumbura" }, { id: "bi-3", name: "Ngozi" }, { id: "bi-4", name: "Rumonge" }, { id: "bi-5", name: "Kayanza" }] },
  { id: "cv", name: "Cabo Verde", code: "CV", cities: [{ id: "cv-1", name: "Praia" }, { id: "cv-2", name: "Mindelo" }, { id: "cv-3", name: "Santa Maria" }, { id: "cv-4", name: "Assomada" }, { id: "cv-5", name: "São Filipe" }] },
  { id: "cm", name: "Cameroon", code: "CM", cities: [{ id: "cm-1", name: "Yaoundé" }, { id: "cm-2", name: "Douala" }, { id: "cm-3", name: "Garoua" }, { id: "cm-4", name: "Bamenda" }, { id: "cm-5", name: "Maroua" }] },
  { id: "cf", name: "Central African Republic", code: "CF", cities: [{ id: "cf-1", name: "Bangui" }, { id: "cf-2", name: "Bimbo" }, { id: "cf-3", name: "Berbérati" }, { id: "cf-4", name: "Carnot" }, { id: "cf-5", name: "Bambari" }] },
  { id: "td", name: "Chad", code: "TD", cities: [{ id: "td-1", name: "N'Djamena" }, { id: "td-2", name: "Moundou" }, { id: "td-3", name: "Sarh" }, { id: "td-4", name: "Abéché" }, { id: "td-5", name: "Kélo" }] },
  { id: "km", name: "Comoros", code: "KM", cities: [{ id: "km-1", name: "Moroni" }, { id: "km-2", name: "Mutsamudu" }, { id: "km-3", name: "Fomboni" }, { id: "km-4", name: "Domoni" }] },
  { id: "cg", name: "Congo", code: "CG", cities: [{ id: "cg-1", name: "Brazzaville" }, { id: "cg-2", name: "Pointe-Noire" }, { id: "cg-3", name: "Dolisie" }, { id: "cg-4", name: "Nkayi" }] },
  { id: "cd", name: "Congo (DRC)", code: "CD", cities: [{ id: "cd-1", name: "Kinshasa" }, { id: "cd-2", name: "Lubumbashi" }, { id: "cd-3", name: "Mbuji-Mayi" }, { id: "cd-4", name: "Kananga" }, { id: "cd-5", name: "Kisangani" }, { id: "cd-6", name: "Goma" }] },
  { id: "ci", name: "Cote d'Ivoire", code: "CI", cities: [{ id: "ci-1", name: "Yamoussoukro" }, { id: "ci-2", name: "Abidjan" }, { id: "ci-3", name: "Bouaké" }, { id: "ci-4", name: "Daloa" }, { id: "ci-5", name: "San-Pédro" }] },
  { id: "dj", name: "Djibouti", code: "DJ", cities: [{ id: "dj-1", name: "Djibouti" }, { id: "dj-2", name: "Ali Sabieh" }, { id: "dj-3", name: "Tadjoura" }, { id: "dj-4", name: "Obock" }, { id: "dj-5", name: "Dikhil" }] },
  { id: "eg", name: "Egypt", code: "EG", cities: [{ id: "eg-1", name: "Cairo" }, { id: "eg-2", name: "Alexandria" }, { id: "eg-3", name: "Giza" }, { id: "eg-4", name: "Shubra El Kheima" }, { id: "eg-5", name: "Port Said" }, { id: "eg-6", name: "Suez" }, { id: "eg-7", name: "Luxor" }] },
  { id: "gq", name: "Equatorial Guinea", code: "GQ", cities: [{ id: "gq-1", name: "Malabo" }, { id: "gq-2", name: "Bata" }, { id: "gq-3", name: "Ciudad de la Paz" }, { id: "gq-4", name: "Ebebiyín" }] },
  { id: "er", name: "Eritrea", code: "ER", cities: [{ id: "er-1", name: "Asmara" }, { id: "er-2", name: "Keren" }, { id: "er-3", name: "Massawa" }, { id: "er-4", name: "Assab" }, { id: "er-5", name: "Mendefera" }] },
  { id: "sz", name: "Eswatini", code: "SZ", cities: [{ id: "sz-1", name: "Mbabane" }, { id: "sz-2", name: "Lobamba" }, { id: "sz-3", name: "Manzini" }, { id: "sz-4", name: "Big Bend" }] },
  { id: "et", name: "Ethiopia", code: "ET", cities: [{ id: "et-1", name: "Addis Ababa" }, { id: "et-2", name: "Dire Dawa" }, { id: "et-3", name: "Mekelle" }, { id: "et-4", name: "Gondar" }, { id: "et-5", name: "Hawassa" }, { id: "et-6", name: "Bahir Dar" }] },
  { id: "ga", name: "Gabon", code: "GA", cities: [{ id: "ga-1", name: "Libreville" }, { id: "ga-2", name: "Port-Gentil" }, { id: "ga-3", name: "Franceville" }, { id: "ga-4", name: "Oyem" }] },
  { id: "gm", name: "Gambia", code: "GM", cities: [{ id: "gm-1", name: "Banjul" }, { id: "gm-2", name: "Serekunda" }, { id: "gm-3", name: "Brikama" }, { id: "gm-4", name: "Bakau" }] },
  { id: "gh", name: "Ghana", code: "GH", cities: [{ id: "gh-1", name: "Accra" }, { id: "gh-2", name: "Kumasi" }, { id: "gh-3", name: "Tamale" }, { id: "gh-4", name: "Sekondi-Takoradi" }, { id: "gh-5", name: "Cape Coast" }] },
  { id: "gn", name: "Guinea", code: "GN", cities: [{ id: "gn-1", name: "Conakry" }, { id: "gn-2", name: "Nzérékoré" }, { id: "gn-3", name: "Kankan" }, { id: "gn-4", name: "Kindia" }, { id: "gn-5", name: "Labé" }] },
  { id: "gw", name: "Guinea-Bissau", code: "GW", cities: [{ id: "gw-1", name: "Bissau" }, { id: "gw-2", name: "Bafatá" }, { id: "gw-3", name: "Gabú" }, { id: "gw-4", name: "Bissora" }] },
  { id: "ke", name: "Kenya", code: "KE", cities: [{ id: "ke-1", name: "Nairobi" }, { id: "ke-2", name: "Mombasa" }, { id: "ke-3", name: "Kisumu" }, { id: "ke-4", name: "Nakuru" }, { id: "ke-5", name: "Eldoret" }, { id: "ke-6", name: "Malindi" }] },
  { id: "ls", name: "Lesotho", code: "LS", cities: [{ id: "ls-1", name: "Maseru" }, { id: "ls-2", name: "Teyateyaneng" }, { id: "ls-3", name: "Mafeteng" }, { id: "ls-4", name: "Hlotse" }] },
  { id: "lr", name: "Liberia", code: "LR", cities: [{ id: "lr-1", name: "Monrovia" }, { id: "lr-2", name: "Gbarnga" }, { id: "lr-3", name: "Kakata" }, { id: "lr-4", name: "Bensonville" }, { id: "lr-5", name: "Harper" }] },
  { id: "ly", name: "Libya", code: "LY", cities: [{ id: "ly-1", name: "Tripoli" }, { id: "ly-2", name: "Benghazi" }, { id: "ly-3", name: "Misrata" }, { id: "ly-4", name: "Bayda" }, { id: "ly-5", name: "Zawiya" }] },
  { id: "mg", name: "Madagascar", code: "MG", cities: [{ id: "mg-1", name: "Antananarivo" }, { id: "mg-2", name: "Toamasina" }, { id: "mg-3", name: "Antsirabe" }, { id: "mg-4", name: "Mahajanga" }, { id: "mg-5", name: "Fianarantsoa" }] },
  { id: "mw", name: "Malawi", code: "MW", cities: [{ id: "mw-1", name: "Lilongwe" }, { id: "mw-2", name: "Blantyre" }, { id: "mw-3", name: "Mzuzu" }, { id: "mw-4", name: "Zomba" }] },
  { id: "ml", name: "Mali", code: "ML", cities: [{ id: "ml-1", name: "Bamako" }, { id: "ml-2", name: "Sikasso" }, { id: "ml-3", name: "Mopti" }, { id: "ml-4", name: "Koutiala" }, { id: "ml-5", name: "Gao" }, { id: "ml-6", name: "Timbuktu" }] },
  { id: "mr", name: "Mauritania", code: "MR", cities: [{ id: "mr-1", name: "Nouakchott" }, { id: "mr-2", name: "Nouadhibou" }, { id: "mr-3", name: "Kiffa" }, { id: "mr-4", name: "Rosso" }] },
  { id: "mu", name: "Mauritius", code: "MU", cities: [{ id: "mu-1", name: "Port Louis" }, { id: "mu-2", name: "Vacoas-Phoenix" }, { id: "mu-3", name: "Beau Bassin-Rose Hill" }, { id: "mu-4", name: "Curepipe" }] },
  { id: "ma", name: "Morocco", code: "MA", cities: [{ id: "ma-1", name: "Rabat" }, { id: "ma-2", name: "Casablanca" }, { id: "ma-3", name: "Marrakesh" }, { id: "ma-4", name: "Fes" }, { id: "ma-5", name: "Tangier" }, { id: "ma-6", name: "Agadir" }] },
  { id: "mz", name: "Mozambique", code: "MZ", cities: [{ id: "mz-1", name: "Maputo" }, { id: "mz-2", name: "Matola" }, { id: "mz-3", name: "Beira" }, { id: "mz-4", name: "Nampula" }, { id: "mz-5", name: "Chimoio" }] },
  { id: "na", name: "Namibia", code: "NA", cities: [{ id: "na-1", name: "Windhoek" }, { id: "na-2", name: "Walvis Bay" }, { id: "na-3", name: "Swakopmund" }, { id: "na-4", name: "Rundu" }, { id: "na-5", name: "Oshakati" }] },
  { id: "ne", name: "Niger", code: "NE", cities: [{ id: "ne-1", name: "Niamey" }, { id: "ne-2", name: "Zinder" }, { id: "ne-3", name: "Maradi" }, { id: "ne-4", name: "Agadez" }, { id: "ne-5", name: "Tahoua" }] },
  { id: "ng", name: "Nigeria", code: "NG", cities: [{ id: "ng-1", name: "Abuja" }, { id: "ng-2", name: "Lagos" }, { id: "ng-3", name: "Kano" }, { id: "ng-4", name: "Ibadan" }, { id: "ng-5", name: "Port Harcourt" }, { id: "ng-6", name: "Benin City" }, { id: "ng-7", name: "Enugu" }] },
  { id: "rw", name: "Rwanda", code: "RW", cities: [{ id: "rw-1", name: "Kigali" }, { id: "rw-2", name: "Butare" }, { id: "rw-3", name: "Gisenyi" }, { id: "rw-4", name: "Ruhengeri" }, { id: "rw-5", name: "Gitarama" }] },
  { id: "st", name: "Sao Tome and Principe", code: "ST", cities: [{ id: "st-1", name: "São Tomé" }, { id: "st-2", name: "Trindade" }, { id: "st-3", name: "Neves" }, { id: "st-4", name: "Santo António" }] },
  { id: "sn", name: "Senegal", code: "SN", cities: [{ id: "sn-1", name: "Dakar" }, { id: "sn-2", name: "Thiès" }, { id: "sn-3", name: "Kaolack" }, { id: "sn-4", name: "Ziguinchor" }, { id: "sn-5", name: "Saint-Louis" }] },
  { id: "sc", name: "Seychelles", code: "SC", cities: [{ id: "sc-1", name: "Victoria" }, { id: "sc-2", name: "Anse Boileau" }, { id: "sc-3", name: "Beau Vallon" }] },
  { id: "sl", name: "Sierra Leone", code: "SL", cities: [{ id: "sl-1", name: "Freetown" }, { id: "sl-2", name: "Bo" }, { id: "sl-3", name: "Kenema" }, { id: "sl-4", name: "Makeni" }] },
  { id: "so", name: "Somalia", code: "SO", cities: [{ id: "so-1", name: "Mogadishu" }, { id: "so-2", name: "Hargeisa" }, { id: "so-3", name: "Bosaso" }, { id: "so-4", name: "Kismayo" }, { id: "so-5", name: "Merca" }] },
  { id: "za", name: "South Africa", code: "ZA", cities: [{ id: "za-1", name: "Pretoria" }, { id: "za-2", name: "Cape Town" }, { id: "za-3", name: "Johannesburg" }, { id: "za-4", name: "Durban" }, { id: "za-5", name: "Gqeberha" }, { id: "za-6", name: "Bloemfontein" }] },
  { id: "ss", name: "South Sudan", code: "SS", cities: [{ id: "ss-1", name: "Juba" }, { id: "ss-2", name: "Wau" }, { id: "ss-3", name: "Malakal" }, { id: "ss-4", name: "Yei" }, { id: "ss-5", name: "Yambio" }] },
  { id: "sd", name: "Sudan", code: "SD", cities: [{ id: "sd-1", name: "Khartoum" }, { id: "sd-2", name: "Omdurman" }, { id: "sd-3", name: "Port Sudan" }, { id: "sd-4", name: "Kassala" }, { id: "sd-5", name: "Nyala" }] },
  { id: "tz", name: "Tanzania", code: "TZ", cities: [{ id: "tz-1", name: "Dodoma" }, { id: "tz-2", name: "Dar es Salaam" }, { id: "tz-3", name: "Mwanza" }, { id: "tz-4", name: "Arusha" }, { id: "tz-5", name: "Zanzibar City" }] },
  { id: "tg", name: "Togo", code: "TG", cities: [{ id: "tg-1", name: "Lomé" }, { id: "tg-2", name: "Sokodé" }, { id: "tg-3", name: "Kara" }, { id: "tg-4", name: "Atakpamé" }] },
  { id: "tn", name: "Tunisia", code: "TN", cities: [{ id: "tn-1", name: "Tunis" }, { id: "tn-2", name: "Sfax" }, { id: "tn-3", name: "Sousse" }, { id: "tn-4", name: "Ettadhamen" }, { id: "tn-5", name: "Kairouan" }] },
  { id: "ug", name: "Uganda", code: "UG", cities: [{ id: "ug-1", name: "Kampala" }, { id: "ug-2", name: "Nansana" }, { id: "ug-3", name: "Kira" }, { id: "ug-4", name: "Mbarara" }, { id: "ug-5", name: "Jinja" }, { id: "ug-6", name: "Gulu" }] },
  { id: "zm", name: "Zambia", code: "ZM", cities: [{ id: "zm-1", name: "Lusaka" }, { id: "zm-2", name: "Kitwe" }, { id: "zm-3", name: "Ndola" }, { id: "zm-4", name: "Kabwe" }, { id: "zm-5", name: "Chingola" }] },
  { id: "zw", name: "Zimbabwe", code: "ZW", cities: [{ id: "zw-1", name: "Harare" }, { id: "zw-2", name: "Bulawayo" }, { id: "zw-3", name: "Chitungwiza" }, { id: "zw-4", name: "Mutare" }, { id: "zw-5", name: "Gweru" }] }
];

export default function OrganizerPortal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bootcamps, setBootcamps] = useState<any[]>([]);
  const [selectedBootcampId, setSelectedBootcampId] = useState<string>("");

  // Create Bootcamp Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [countries, setCountries] = useState<any[]>([]);
  const [createCountryId, setCreateCountryId] = useState("");
  const [cities, setCities] = useState<any[]>([]);
  const [createCityId, setCreateCityId] = useState("");
  const [maxSeats, setMaxSeats] = useState(30);
  const [startDate, setStartDate] = useState("2026-08-01");
  const [endDate, setEndDate] = useState("2026-08-05");

  // Edit Bootcamp Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMaxSeats, setEditMaxSeats] = useState(30);
  const [editStatus, setEditStatus] = useState("UPCOMING");

  // Manage Curriculum Modal State
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [currDay, setCurrDay] = useState<number>(1);
  const [currTitle, setCurrTitle] = useState("");
  const [currContent, setCurrContent] = useState("");
  const [currTasks, setCurrTasks] = useState("");
  const [currDifficulty, setCurrDifficulty] = useState("MEDIUM");
  const [currSaveMsg, setCurrSaveMsg] = useState("");

  // Scanner State
  const [scanDay, setScanDay] = useState<number>(1);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Live Leaderboard & WebSocket
  const [leaderboardDay, setLeaderboardDay] = useState<number>(1);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Submissions & Grading
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [payoutAmounts, setPayoutAmounts] = useState<{ [subId: string]: number }>({});
  const [payoutLogs, setPayoutLogs] = useState<{ [subId: string]: any }>({});

  useEffect(() => {
    const token = localStorage.getItem("afr_token");
    const storedUser = localStorage.getItem("afr_user");
    if (!token || !storedUser) {
      router.push("/auth/login");
      return;
    }
    const parsed = JSON.parse(storedUser);
    
    // Strict Role Separation Guard
    if (parsed.role !== "ORGANIZER" && parsed.role !== "ADMIN") {
      router.push("/developer");
      return;
    }

    setUser(parsed);

    fetchBootcamps(token);
    fetchCountries();
  }, []);

  const fetchBootcamps = async (token?: string) => {
    const authToken = token || localStorage.getItem("afr_token");
    try {
      const res = await axios.get("http://localhost:4000/api/bootcamps");
      setBootcamps(res.data);
      if (res.data.length > 0) {
        const initialId = selectedBootcampId || res.data[0].id;
        setSelectedBootcampId(initialId);
        fetchSubmissions(initialId, authToken);
        setupWebSocket(initialId, 1);

        const currentBootcamp = res.data.find((b: any) => b.id === initialId) || res.data[0];
        populateBootcampFields(currentBootcamp);
      }
    } catch (e) {}
  };

  const populateBootcampFields = (b: any) => {
    setEditTitle(b.title);
    setEditDescription(b.description);
    setEditMaxSeats(b.maxSeats);
    setEditStatus(b.status);

    const curriculum = (b.curriculum as any[]) || [];
    const day1 = curriculum.find((c) => c.day === 1);
    if (day1) {
      setCurrTitle(day1.title || "");
      setCurrContent(day1.contentMarkdown || "");
      setCurrTasks((day1.tasks || []).join("\n"));
      setCurrDifficulty(day1.quizDifficulty || "MEDIUM");
    }
  };

  const fetchCountries = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/locations/countries");
      const list = (res.data && res.data.length > 0) ? res.data : AFRICAN_COUNTRIES_FALLBACK;
      setCountries(list);
      if (list.length > 0) {
        setCreateCountryId(list[0].id);
        if (list[0].cities && list[0].cities.length > 0) {
          setCities(list[0].cities);
          setCreateCityId(list[0].cities[0].id);
        }
      }
    } catch (e) {
      setCountries(AFRICAN_COUNTRIES_FALLBACK);
      setCreateCountryId(AFRICAN_COUNTRIES_FALLBACK[0].id);
      setCities(AFRICAN_COUNTRIES_FALLBACK[0].cities);
      setCreateCityId(AFRICAN_COUNTRIES_FALLBACK[0].cities[0].id);
    }
  };

  const handleCountryChange = async (cId: string) => {
    setCreateCountryId(cId);
    setCreateCityId("");
    if (!cId) return;

    const targetCountry = countries.find((c) => c.id === cId);
    if (targetCountry && targetCountry.cities && targetCountry.cities.length > 0) {
      setCities(targetCountry.cities);
      setCreateCityId(targetCountry.cities[0].id);
      return;
    }

    try {
      const res = await axios.get(`http://localhost:4000/api/locations/countries/${cId}/cities`);
      if (res.data && res.data.length > 0) {
        setCities(res.data);
        setCreateCityId(res.data[0].id);
      }
    } catch (e) {}
  };

  const handleCreateBootcamp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("afr_token");
    const targetCityId = createCityId || (cities.length > 0 ? cities[0].id : "et-1");
    const sDate = startDate ? new Date(startDate).toISOString() : new Date("2026-08-01").toISOString();
    const eDate = endDate ? new Date(endDate).toISOString() : new Date("2026-08-05").toISOString();

    // Resolve city and country names for backend fallback resolution
    const selectedCity = cities.find((c: any) => c.id === targetCityId);
    const selectedCountry = countries.find((c: any) => c.id === createCountryId);
    const resolvedCityName = selectedCity?.name || "Addis Ababa";
    const resolvedCountryCode = selectedCountry?.code || "ET";

    try {
      const res = await axios.post(
        "http://localhost:4000/api/bootcamps",
        {
          title: title ? title : "AFR Lightning Bootcamp",
          description: description ? description : "5-day intensive Lightning Network developer bootcamp",
          cityId: targetCityId,
          cityName: resolvedCityName,
          countryCode: resolvedCountryCode,
          maxSeats: Number(maxSeats || 30),
          startDate: sDate,
          endDate: eDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowCreateModal(false);
      setSelectedBootcampId(res.data.id);
      fetchBootcamps(token);
    } catch (err: any) {
      console.error("Bootcamp creation error:", err);
      if (err.response) {
        // Server responded with an error status
        const serverMsg = err.response?.data?.message;
        const detailedError = Array.isArray(serverMsg) ? serverMsg.join(", ") : serverMsg;
        alert("Server error: " + (detailedError || JSON.stringify(err.response.data)));
      } else if (err.request) {
        // Request was made but no response received (network error)
        alert("Network error: Could not reach the backend server at localhost:4000. Please make sure it is running.");
      } else {
        alert("Error: " + err.message);
      }
    }
  };

  const handleEditBootcamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBootcampId) return;
    const token = localStorage.getItem("afr_token");
    try {
      await axios.put(
        `http://localhost:4000/api/bootcamps/${selectedBootcampId}`,
        {
          title: editTitle,
          description: editDescription,
          maxSeats: Number(editMaxSeats),
          status: editStatus,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditModal(false);
      fetchBootcamps(token);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update bootcamp details.");
    }
  };

  const handleCurrDaySelect = (dayNum: number) => {
    setCurrDay(dayNum);
    const target = bootcamps.find((b) => b.id === selectedBootcampId);
    if (target) {
      const curriculum = (target.curriculum as any[]) || [];
      const d = curriculum.find((c) => c.day === dayNum);
      if (d) {
        setCurrTitle(d.title || "");
        setCurrContent(d.contentMarkdown || "");
        setCurrTasks((d.tasks || []).join("\n"));
        setCurrDifficulty(d.quizDifficulty || "MEDIUM");
      } else {
        setCurrTitle(`Day ${dayNum} Curriculum`);
        setCurrContent("");
        setCurrTasks("");
        setCurrDifficulty("MEDIUM");
      }
    }
  };

  const handleSaveCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBootcampId) return;
    const token = localStorage.getItem("afr_token");
    setCurrSaveMsg("");

    const tasksArray = currTasks.split("\n").map((t) => t.trim()).filter(Boolean);

    try {
      await axios.put(
        `http://localhost:4000/api/bootcamps/${selectedBootcampId}/curriculum/day/${currDay}`,
        {
          title: currTitle,
          contentMarkdown: currContent,
          tasks: tasksArray,
          quizDifficulty: currDifficulty,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrSaveMsg(`Day ${currDay} curriculum content saved successfully!`);
      fetchBootcamps(token);
    } catch (err: any) {
      setCurrSaveMsg(err.response?.data?.message || "Failed to save curriculum.");
    }
  };

  const [selectedQuizTimeLimits, setSelectedQuizTimeLimits] = useState<{ [day: number]: number }>({
    1: 10,
    2: 10,
    3: 10,
    4: 10,
  });

  const handleToggleQuizUnlock = async (dayNum: number, unlockState: boolean, customTimeLimitMinutes?: number) => {
    if (!selectedBootcampId) return;
    const token = localStorage.getItem("afr_token");
    const limit = customTimeLimitMinutes || selectedQuizTimeLimits[dayNum] || 10;
    try {
      await axios.put(
        `http://localhost:4000/api/bootcamps/${selectedBootcampId}/quiz/unlock`,
        {
          dayNumber: dayNum,
          unlocked: unlockState,
          timeLimitMinutes: limit,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBootcamps(token);
    } catch (err: any) {
      alert("Failed to update quiz status.");
    }
  };

  // Setup Socket.io Real-Time Leaderboard Stream
  const setupWebSocket = (bootcampId: string, dayNum: number) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io("http://localhost:4000");
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_bootcamp_leaderboard", { bootcampId, dayNumber: dayNum });
    });

    socket.on("leaderboard_update", (data: any) => {
      if (data.bootcampId === bootcampId && data.dayNumber === dayNum) {
        setLeaderboard(data.leaderboard || []);
      }
    });

    fetchLeaderboardRest(bootcampId, dayNum);
  };

  const fetchLeaderboardRest = async (bId: string, dayNum: number) => {
    try {
      const res = await axios.get(`http://localhost:4000/api/quiz/leaderboard/${bId}/day/${dayNum}`);
      setLeaderboard(res.data);
    } catch (e) {}
  };

  const handleBootcampSelect = (bId: string) => {
    setSelectedBootcampId(bId);
    fetchSubmissions(bId);
    setupWebSocket(bId, leaderboardDay);

    const target = bootcamps.find((b) => b.id === bId);
    if (target) {
      populateBootcampFields(target);
    }
  };

  const handleLeaderboardDayChange = (dayNum: number) => {
    setLeaderboardDay(dayNum);
    if (selectedBootcampId) {
      setupWebSocket(selectedBootcampId, dayNum);
    }
  };

  const toggleScanner = () => {
    if (scannerActive) {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      setScannerActive(false);
    } else {
      setScannerActive(true);
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
        scannerRef.current = scanner;
        scanner.render(onScanSuccess, (err) => {});
      }, 100);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    setScannerActive(false);

    const token = localStorage.getItem("afr_token");
    try {
      const res = await axios.post(
        "http://localhost:4000/api/attendance/scan",
        {
          qrToken: decodedText,
          dayNumber: scanDay,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setScanResult({ type: "success", text: res.data.message, data: res.data });
    } catch (err: any) {
      setScanResult({
        type: "error",
        text: err.response?.data?.message || "Failed to record attendance.",
      });
    }
  };

  const fetchSubmissions = async (bId: string, token?: string) => {
    const authToken = token || localStorage.getItem("afr_token");
    try {
      const res = await axios.get(`http://localhost:4000/api/submissions/bootcamp/${bId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setSubmissions(res.data);
    } catch (e) {}
  };

  const handleGradeSubmission = async (subId: string, rating: number, comment: string) => {
    const token = localStorage.getItem("afr_token");
    try {
      await axios.put(
        `http://localhost:4000/api/submissions/${subId}/review`,
        { rating, reviewComment: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchSubmissions(selectedBootcampId, token);
    } catch (e) {}
  };

  const handleTriggerPayout = async (sub: any) => {
    const token = localStorage.getItem("afr_token");
    const amountSats = payoutAmounts[sub.id] || 10000;

    try {
      const res = await axios.post(
        "http://localhost:4000/api/payouts/process",
        {
          developerId: sub.developerId,
          bootcampId: sub.bootcampId,
          submissionId: sub.id,
          amountSats,
          lightningAddress: sub.developer?.lightningAddress,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPayoutLogs((prev) => ({
        ...prev,
        [sub.id]: { type: "success", text: res.data.message, preimage: res.data.preimage },
      }));
      fetchSubmissions(selectedBootcampId, token);
    } catch (err: any) {
      setPayoutLogs((prev) => ({
        ...prev,
        [sub.id]: { type: "error", text: err.response?.data?.message || "Payout execution failed." },
      }));
    }
  };

  if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) return null;

  const currentBootcamp = bootcamps.find((b) => b.id === selectedBootcampId);
  const currentCurriculum = (currentBootcamp?.curriculum as any[]) || [];

  return (
    <div className="space-y-6">
      {/* Organizer Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#120A00] via-[#1C1200] to-[#120A00] border border-yellow-500/25 p-6 shadow-glow-gold">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">Organizer Portal</h1>
                <p className="text-sm text-white/80 mt-0.5">
                  Manage curriculum, control quizzes, and execute payouts
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-md whitespace-nowrap"
            >
              <Plus className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Create Bootcamp</span>
            </Button>
          </div>

          {bootcamps.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedBootcampId}
                onChange={(e) => handleBootcampSelect(e.target.value)}
                className="flex-1 h-10 px-4 rounded-lg border border-white/20 bg-white/10 backdrop-blur-md text-white text-xs sm:text-sm focus:ring-2 focus:ring-white/50 truncate"
              >
                {bootcamps.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900">
                    {b.title} ({b.city?.name})
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCurriculumModal(true)}
                  className="flex-1 sm:flex-none whitespace-nowrap bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-md"
                >
                  <BookOpen className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Manage Content</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  className="flex-1 sm:flex-none whitespace-nowrap bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-md"
                >
                  <Edit3 className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiz Unlock Control */}
      {currentBootcamp && (
        <div className="relative overflow-hidden rounded-xl afr-glass-terracotta border border-afr-terracotta/40 p-5 shadow-glow-terracotta/20">
          <div className="relative z-10 space-y-4">
            <div>
              <h4 className="font-bold text-base text-white flex items-center space-x-2">
                <Lock className="w-5 h-5 flex-shrink-0 text-afr-terracotta" />
                <span>Daily Quiz Controller</span>
              </h4>
              <p className="text-sm text-slate-400 mt-1">
                Publish milestone quizzes for developers after they complete tasks
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {[1, 2, 3, 4].map((dNum) => {
                const dayObj = currentCurriculum.find((c) => c.day === dNum) || { quizUnlocked: false };
                const isUnlocked = Boolean(dayObj.quizUnlocked);
                return (
                  <button
                    key={dNum}
                    type="button"
                    onClick={() => handleToggleQuizUnlock(dNum, !isUnlocked)}
                    className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                      isUnlocked
                        ? "bg-afr-emerald text-white shadow-glow-emerald"
                        : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700"
                    }`}
                  >
                    {isUnlocked ? <Unlock className="w-4 h-4 flex-shrink-0" /> : <Lock className="w-4 h-4 flex-shrink-0" />}
                    <span className="hidden sm:inline">Day {dNum}</span>
                    <span className="sm:hidden">D{dNum}</span>
                    <span className="hidden md:inline">{isUnlocked ? "✓" : "Locked"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {bootcamps.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl afr-glass border border-slate-800 p-12">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-afr-amber/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 text-center space-y-6 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-afr-amber to-afr-terracotta flex items-center justify-center mx-auto shadow-glow-amber">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-bold font-display text-white">No Bootcamps Yet</h3>
              <p className="text-base text-slate-400">
                Create your first Lightning bootcamp to unlock QR scanner, curriculum editor, and payouts.
              </p>
            </div>
            <Button
              variant="amber"
              size="lg"
              onClick={() => setShowCreateModal(true)}
              className="shadow-glow-amber"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span>Create Your First Bootcamp</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* QR Scanner — distinct copper/bronze card */}
          <div className="space-y-6">
            <div className="card-scanner p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-100">QR Scanner</h3>
                    <p className="text-xs text-amber-300/70">Day {scanDay} Check-In</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((d) => (
                    <button
                      key={d}
                      onClick={() => setScanDay(d)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        scanDay === d
                          ? "bg-amber-400 text-slate-950 shadow-glow-terracotta"
                          : "bg-amber-500/10 border border-amber-500/20 text-amber-300/60 hover:text-amber-200"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant={scannerActive ? "outline" : "amber"}
                size="md"
                onClick={toggleScanner}
                className={`w-full ${scannerActive ? "border-amber-500/40 text-amber-200" : "shadow-glow-gold"}`}
              >
                {scannerActive ? "Stop Camera Scanner" : "Activate PWA Camera Scanner"}
              </Button>

              <div id="qr-reader" className={`mt-4 w-full overflow-hidden rounded-lg border border-amber-500/20 bg-black/40 ${!scannerActive ? "hidden" : ""}`} />

              {scanResult && (
                <div className={`mt-4 p-4 rounded-lg text-sm space-y-2 border ${
                  scanResult.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}>
                  <div className="flex items-center space-x-2 font-bold">
                    {scanResult.type === "success"
                      ? <CheckCircle2 className="w-5 h-5" />
                      : <AlertCircle className="w-5 h-5" />}
                    <span>{scanResult.text}</span>
                  </div>
                  {scanResult.data && (
                    <p className="text-xs opacity-70">
                      Developer: {scanResult.data.developer?.name} · Day {scanResult.data.dayNumber}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Leaderboard — deep navy card */}
            <div className="card-leaderboard p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-blue-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30 animate-pulse">LIVE</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400/80 text-[10px] font-bold border border-blue-500/20">REDIS</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">Leaderboard — Day {leaderboardDay}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((d) => (
                    <button
                      key={d}
                      onClick={() => handleLeaderboardDayChange(d)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        leaderboardDay === d
                          ? "bg-blue-500 text-white shadow-glow-navy"
                          : "bg-blue-500/10 border border-blue-500/20 text-blue-400/70 hover:text-blue-200"
                      }`}
                    >
                      D{d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-4 space-y-3">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-blue-300/50 py-6 text-center">
                    No scores for Day {leaderboardDay} yet. Updates stream live when developers submit quizzes.
                  </p>
                ) : (
                  leaderboard.map((item, index) => (
                    <div
                      key={item.developerId || index}
                      className={`p-4 rounded-lg flex items-center justify-between transition-all border ${
                        index === 0
                          ? "bg-yellow-400/10 border-yellow-400/40"
                          : index === 1
                          ? "bg-slate-400/10 border-slate-400/30"
                          : index === 2
                          ? "bg-orange-500/10 border-orange-500/30"
                          : "bg-blue-500/5 border-blue-500/15"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                          index === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-950"
                          : index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900"
                          : index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                          : "bg-blue-500/20 text-blue-300"
                        }`}>
                          #{item.rank || index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{item.name}</p>
                          <p className="text-xs text-slate-400">{item.lightningAddress || item.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-black ${index === 0 ? "text-yellow-300" : "text-white"}`}>
                          {item.score}
                        </span>
                        <p className="text-xs text-slate-500">PTS</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Day 5 Project Review & Payouts */}
            <div className="relative overflow-hidden rounded-xl afr-glass border border-slate-800 shadow-glass">
              <div className="p-5">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-afr-emerald to-afr-emerald-dark flex items-center justify-center shadow-glow-emerald">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-afr-emerald/20 text-afr-emerald text-[10px] font-bold border border-afr-emerald/30">DAY 5 HACKATHON</span>
                    <h3 className="text-lg font-bold text-white mt-1">Project Review & Payouts</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {submissions.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">No Day 5 project submissions yet.</p>
                  ) : (
                    submissions.map((sub) => (
                      <div key={sub.id} className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-4 hover:border-afr-amber/30 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-base text-white">{sub.developer?.name}</h4>
                            <p className="text-xs text-afr-amber font-mono">
                              ⚡ {sub.developer?.lightningAddress || "Not Configured"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <a href={sub.githubUrl} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm">
                                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                GitHub
                              </Button>
                            </a>
                            {sub.demoUrl && (
                              <a href={sub.demoUrl} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm">
                                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                  Demo
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                          {sub.description}
                        </p>

                        <div className="flex items-center space-x-3 pt-2">
                          <span className="text-xs font-bold text-slate-400">RATING:</span>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            defaultValue={sub.rating || 0}
                            onBlur={(e) => handleGradeSubmission(sub.id, Number(e.target.value), "Rated by organizer")}
                            className="w-20 h-8 text-sm font-bold text-afr-emerald bg-slate-950 border-slate-800"
                          />
                          <span className="text-xs text-slate-500">/ 10.0</span>
                          {sub.rating >= 8 && (
                            <Star className="w-4 h-4 text-afr-amber fill-afr-amber" />
                          )}
                        </div>

                        <div className="p-4 rounded-lg afr-glass-emerald space-y-3">
                          <p className="text-sm font-bold text-afr-emerald">
                            ⚡ LIGHTNING PAYOUT (LUD-16)
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Amount in Sats"
                              defaultValue={10000}
                              onChange={(e) =>
                                setPayoutAmounts((prev) => ({ ...prev, [sub.id]: Number(e.target.value) }))
                              }
                              className="sm:w-36 h-9 text-sm font-mono bg-slate-950 border-afr-emerald/30 text-afr-emerald"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTriggerPayout(sub)}
                              className="bg-afr-emerald hover:bg-afr-emerald-dark text-white shadow-glow-emerald whitespace-nowrap"
                            >
                              <Zap className="w-4 h-4 mr-1.5 fill-white" />
                              Pay Sat Prize
                            </Button>
                          </div>

                          {payoutLogs[sub.id] && (
                            <div
                              className={`p-3 rounded-lg text-sm font-mono ${
                                payoutLogs[sub.id].type === "success"
                                  ? "bg-afr-emerald/20 border border-afr-emerald/50 text-afr-emerald"
                                  : "bg-afr-terracotta/20 border border-afr-terracotta/50 text-afr-terracotta-warm"
                              }`}
                            >
                              <p>{payoutLogs[sub.id].text}</p>
                              {payoutLogs[sub.id].preimage && (
                                <p className="text-xs break-all text-slate-400 mt-2">
                                  Preimage: {payoutLogs[sub.id].preimage}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Daily Curriculum Modal */}
      {showCurriculumModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="w-full max-w-3xl afr-glass rounded-2xl shadow-glass border border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-afr-amber to-afr-terracotta p-5 flex items-center justify-between">
              <h3 className="text-2xl font-bold font-display text-white">Manage Daily Curriculum</h3>
              <button
                onClick={() => setShowCurriculumModal(false)}
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
                {[1, 2, 3, 4, 5].map((dNum) => (
                  <button
                    key={dNum}
                    onClick={() => handleCurrDaySelect(dNum)}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                      currDay === dNum
                        ? "bg-afr-amber text-slate-950 shadow-glow-amber"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    DAY {dNum}
                  </button>
                ))}
              </div>

              {currSaveMsg && (
                <div className="p-4 rounded-lg bg-afr-emerald/20 border border-afr-emerald/50 text-afr-emerald text-sm font-medium">
                  ✓ {currSaveMsg}
                </div>
              )}

              <form onSubmit={handleSaveCurriculum} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Day {currDay} Module Title</label>
                  <Input
                    required
                    value={currTitle}
                    onChange={(e) => setCurrTitle(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">Curriculum Content (Markdown Format)</label>
                  <textarea
                    required
                    rows={6}
                    value={currContent}
                    onChange={(e) => setCurrContent(e.target.value)}
                    placeholder="# Day 1 Topic..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-afr-amber focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">Mandatory Task Checklist (One task per line)</label>
                  <textarea
                    rows={3}
                    value={currTasks}
                    onChange={(e) => setCurrTasks(e.target.value)}
                    placeholder="Understand Payment Channels&#10;Set up LND node&#10;Verify invoice"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-afr-amber focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">Quiz Difficulty</label>
                  <select
                    value={currDifficulty}
                    onChange={(e) => setCurrDifficulty(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg border border-slate-800 bg-slate-950 text-white text-sm focus:ring-2 focus:ring-afr-amber focus:border-transparent"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowCurriculumModal(false)}>
                    Close
                  </Button>
                  <Button type="submit" variant="amber" className="shadow-glow-amber">
                    <Save className="w-4 h-4 mr-1.5" />
                    Save Day {currDay} Curriculum
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Bootcamp Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="w-full max-w-lg afr-glass rounded-2xl shadow-glass border border-slate-800 overflow-hidden">
            <div className="bg-gradient-to-r from-afr-amber to-afr-terracotta p-5 flex items-center justify-between">
              <h3 className="text-xl font-bold font-display text-white">Create New AFR Bootcamp</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBootcamp} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Bootcamp Title</label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="AFR Nairobi Lightning Developer Bootcamp"
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="5-day intensive Lightning Network developer bootcamp..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-afr-amber"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">African Country</label>
                  <select
                    required
                    value={createCountryId}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-800 bg-slate-950 text-white text-sm focus:ring-2 focus:ring-afr-amber"
                  >
                    <option value="">Select Country</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">City Hub</label>
                  <select
                    required
                    value={createCityId}
                    onChange={(e) => setCreateCityId(e.target.value)}
                    disabled={!createCountryId}
                    className="w-full h-11 px-3 rounded-lg border border-slate-800 bg-slate-950 text-white text-sm disabled:opacity-40 focus:ring-2 focus:ring-afr-amber"
                  >
                    <option value="">Select City</option>
                    {cities.map((ct) => (
                      <option key={ct.id} value={ct.id}>{ct.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Max Seat Capacity</label>
                <Input
                  type="number"
                  min={1}
                  value={maxSeats}
                  onChange={(e) => setMaxSeats(Number(e.target.value))}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="amber" className="shadow-glow-amber">
                  Create Bootcamp
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bootcamp Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="w-full max-w-lg afr-glass rounded-2xl shadow-glass border border-slate-800 overflow-hidden">
            <div className="bg-gradient-to-r from-afr-terracotta to-afr-terracotta-deep p-5 flex items-center justify-between">
              <h3 className="text-xl font-bold font-display text-white">Edit Bootcamp Details</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditBootcamp} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Bootcamp Title</label>
                <Input
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">Description</label>
                <textarea
                  required
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-afr-terracotta"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Max Seat Capacity</label>
                  <Input
                    type="number"
                    min={1}
                    value={editMaxSeats}
                    onChange={(e) => setEditMaxSeats(Number(e.target.value))}
                    className="bg-slate-950 border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-800 bg-slate-950 text-white text-sm focus:ring-2 focus:ring-afr-terracotta"
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="terracotta" className="shadow-glow-terracotta">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
