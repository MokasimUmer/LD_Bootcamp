"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, MapPin, Users, Calendar, ArrowRight, Sparkles, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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

export default function HomePage() {
  const router = useRouter();
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>("");

  const [bootcamps, setBootcamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [registerMsg, setRegisterMsg] = useState<{ id: string; type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("afr_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }

    fetchCountries();
    fetchBootcamps();
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/locations/countries");
      if (res.data && res.data.length > 0) {
        setCountries(res.data);
      } else {
        setCountries(AFRICAN_COUNTRIES_FALLBACK);
      }
    } catch (e) {
      setCountries(AFRICAN_COUNTRIES_FALLBACK);
    }
  };

  const handleCountryChange = async (countryId: string) => {
    setSelectedCountryId(countryId);
    setSelectedCityId("");
    if (!countryId) {
      setCities([]);
      fetchBootcamps();
      return;
    }

    const targetCountry = countries.find((c) => c.id === countryId);
    if (targetCountry && targetCountry.cities && targetCountry.cities.length > 0) {
      setCities(targetCountry.cities);
      fetchBootcamps(undefined, countryId);
      return;
    }

    try {
      const res = await axios.get(`http://localhost:4000/api/locations/countries/${countryId}/cities`);
      if (res.data && res.data.length > 0) {
        setCities(res.data);
      }
    } catch (e) {}
    fetchBootcamps(undefined, countryId);
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    fetchBootcamps(cityId, selectedCountryId);
  };

  const fetchBootcamps = async (cityId?: string, countryId?: string) => {
    setLoading(true);
    try {
      let url = "http://localhost:4000/api/bootcamps";
      const params = new URLSearchParams();
      if (cityId) params.append("cityId", cityId);
      if (countryId) params.append("countryId", countryId);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await axios.get(url);
      setBootcamps(res.data);
    } catch (e) {
      setBootcamps([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSeat = async (bootcampId: string) => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    const token = localStorage.getItem("afr_token");
    setRegisterMsg(null);

    try {
      const res = await axios.post(
        "http://localhost:4000/api/registrations",
        { bootcampId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRegisterMsg({
        id: bootcampId,
        type: "success",
        text: "Seat reserved! Your cryptographic QR token has been generated.",
      });
      fetchBootcamps(selectedCityId, selectedCountryId);
    } catch (err: any) {
      setRegisterMsg({
        id: bootcampId,
        type: "error",
        text: err.response?.data?.message || "Registration failed.",
      });
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative text-center py-16 px-4 rounded-3xl afr-glass border-slate-800 shadow-glow-amber/10 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-afr-amber/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-afr-terracotta/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <Badge variant="amber" className="mx-auto">
            AFRICA FREE ROUTING (AFR) &bull; LIGHTNING DEVELOPER BOOTCAMP
          </Badge>

          <h1 className="text-4xl md:text-6xl font-black font-display tracking-tight text-white leading-tight">
            Empowering <span className="afr-gradient-gold">African Developers</span> to Build the Future of Bitcoin Lightning
          </h1>

          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            5-day intensive hybrid bootcamps across 54 African nations. Master payment channels, LNURL specs, WebLN integration, and claim instant satoshi payouts.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {!user ? (
              <>
                <Link href="/auth/register">
                  <Button variant="amber" size="lg" className="shadow-glow-amber">
                    <Zap className="w-5 h-5 mr-2 fill-slate-950" />
                    <span>Apply for Bootcamp</span>
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="glass" size="lg">
                    Sign In
                  </Button>
                </Link>
              </>
            ) : user.role === "ORGANIZER" || user.role === "ADMIN" ? (
              <Link href="/organizer">
                <Button variant="terracotta" size="lg" className="shadow-glow-terracotta">
                  <Shield className="w-5 h-5 mr-2" />
                  <span>Go to Organizer Portal</span>
                </Button>
              </Link>
            ) : (
              <Link href="/developer">
                <Button variant="amber" size="lg" className="shadow-glow-amber">
                  <Zap className="w-5 h-5 mr-2 fill-slate-950" />
                  <span>Go to Developer Portal</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Hierarchical Location Filter */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-white">Find Bootcamps in Africa</h2>
            <p className="text-xs text-slate-400">Filter upcoming Lightning bootcamps by African country & city hub.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Country Selector */}
            <div className="flex items-center space-x-2 afr-glass px-3 py-1.5 rounded-xl border-slate-800">
              <MapPin className="w-4 h-4 text-afr-amber" />
              <select
                value={selectedCountryId}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-200">All 54 African Countries</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* City Selector */}
            <div className="flex items-center space-x-2 afr-glass px-3 py-1.5 rounded-xl border-slate-800">
              <select
                value={selectedCityId}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={!selectedCountryId || cities.length === 0}
                className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer disabled:opacity-40"
              >
                <option value="" className="bg-slate-900 text-slate-200">All City Hubs</option>
                {cities.map((ct) => (
                  <option key={ct.id} value={ct.id} className="bg-slate-900 text-slate-200">
                    {ct.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bootcamp Cards List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 font-mono text-xs">
            Loading AFR Bootcamps...
          </div>
        ) : bootcamps.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <AlertCircle className="w-10 h-10 text-afr-amber mx-auto" />
              <p className="text-slate-400 text-sm">No bootcamps found matching the selected location.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bootcamps.map((bootcamp) => (
              <Card key={bootcamp.id} className="afr-card hover:border-afr-amber/50 transition-all flex flex-col justify-between">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="amber">
                      📍 {bootcamp.city?.country?.name || "Africa"} &bull; {bootcamp.city?.name}
                    </Badge>
                    <Badge variant={bootcamp.isFull ? "terracotta" : "emerald"}>
                      {bootcamp.remainingSeats} SEATS LEFT
                    </Badge>
                  </div>

                  <CardTitle className="text-xl leading-snug">{bootcamp.title}</CardTitle>
                  <CardDescription className="line-clamp-2 text-xs leading-relaxed">
                    {bootcamp.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-afr-amber" />
                      <span>{bootcamp.registeredCount} / {bootcamp.maxSeats} Devs</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-afr-amber" />
                      <span>5-Day Intensive</span>
                    </div>
                  </div>

                  {registerMsg && registerMsg.id === bootcamp.id && (
                    <div
                      className={`p-2.5 rounded-lg text-xs flex items-center space-x-2 border ${
                        registerMsg.type === "success"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-red-500/10 border-red-500/30 text-red-300"
                      }`}
                    >
                      {registerMsg.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      <span>{registerMsg.text}</span>
                    </div>
                  )}

                  <Button
                    variant={bootcamp.isFull ? "ghost" : "amber"}
                    size="md"
                    disabled={bootcamp.isFull}
                    onClick={() => handleRegisterSeat(bootcamp.id)}
                    className="w-full shadow-glow-amber"
                  >
                    <span>{bootcamp.isFull ? "Bootcamp Full" : "Reserve Seat Now"}</span>
                    {!bootcamp.isFull && <ArrowRight className="w-4 h-4 ml-1.5" />}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
