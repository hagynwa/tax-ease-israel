"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, History, CalendarClock, UploadCloud, FileType2, Loader2, CheckCircle2, FileDown, Info, User, GraduationCap, Baby, Award, HeartPulse, Scale, Home, Plane, Camera, Coins, ShieldCheck, MapPin, Building, CreditCard, Share2, ExternalLink, RotateCcw, Plus, Clock } from "lucide-react";
import ProgressBar from "./ProgressBar";
import Link from "next/link";
import PrintableSummary from "./PrintableSummary";
import { calculateChildPoints } from "@/lib/taxCalculator";
import { getPeripheryBenefitByCity } from "@/lib/peripheryMap";
import { BANKS, getBranchesForBank } from "@/lib/bankData";
import { createClient } from "@/utils/supabase/client";

type FlowType = "none" | "refund" | "coordination";

interface AnalysisResult {
  data: {
    employerName: string;
    employerId: string;
    income: number;
    taxPaid: number;
    monthsWorked: number;
  };
  analysis: {
    grossIncome: number;
    taxPaid: number;
    taxOwed: number;
    anticipatedRefund: number;
    breakdown?: string[];
  }
}

const persistKey = "tax_ease_wizard_state";
// Set to true to bypass auth during testing. Set to false in production.
const BYPASS_AUTH = true;

export default function WizardFlow() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [step, setStep] = useState(0);

  // AUTH & PERSISTENCE LIFECYCLE
  useEffect(() => {
    // 1. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    // 2. Hydrate State from LocalStorage (if returning from login)
    const saved = localStorage.getItem(persistKey);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setStep(state.step);
        setFlow(state.flow);
        setSelectedYear(state.selectedYear);
        setGender(state.gender);
        setChildBirthYears(state.childBirthYears);
        setResult(state.result);
        setFirstName(state.firstName);
        setLastName(state.lastName);
        setIdNumber(state.idNumber);
        setCity(state.city);
        // Clear it so it doesn't stay forever
        localStorage.removeItem(persistKey);
      } catch (e) {
        console.error("Failed to hydrate state", e);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    // Save current progress before redirect
    const stateToSave = {
      step, flow, selectedYear, gender, childBirthYears, result, 
      firstName, lastName, idNumber, city
    };
    localStorage.setItem(persistKey, JSON.stringify(stateToSave));

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/api/auth/callback?next=/wizard'
      }
    });
  };
  const [flow, setFlow] = useState<FlowType>("none");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // Custom Points Engine State
  const [gender, setGender] = useState<"male" | "female">("male");
  const [childBirthYears, setChildBirthYears] = useState<number[]>([]);
  const [uploadingId, setUploadingId] = useState(false);
  const [degree, setDegree] = useState<"none" | "bachelor" | "master">("none");
  const [degreeYear, setDegreeYear] = useState<number | "">("");
  const [degreeDeferred, setDegreeDeferred] = useState(false);
  const [soldier, setSoldier] = useState(false);
  const [didReserves, setDidReserves] = useState(false);
  const [singleParent, setSingleParent] = useState(false);
  const [maritalStatus, setMaritalStatus] = useState("single"); // single, married, divorced, widowed

  // Advanced Demographics
  const [isOleh, setIsOleh] = useState(false);
  const [hasDisability, setHasDisability] = useState(false); 
  const [paysAlimony, setPaysAlimony] = useState(false); 
  
  // Maternity & Birth
  const [gaveBirthThisYear, setGaveBirthThisYear] = useState(false);
  const [maternityAllowance, setMaternityAllowance] = useState<number>(0);
  const [uploadingMaternity, setUploadingMaternity] = useState(false);
  const [unpaidLeaveMonths, setUnpaidLeaveMonths] = useState<number>(0);
  const [deferredPoint, setDeferredPoint] = useState(false);
  
  // Expert Tax Law Requirements
  const [livesInPeriphery, setLivesInPeriphery] = useState(false);
  const [peripheryPercent, setPeripheryPercent] = useState<number>(0);
  const [peripheryCeiling, setPeripheryCeiling] = useState<number>(200000);
  const [donations, setDonations] = useState<number>(0);
  const [lifeInsurance, setLifeInsurance] = useState<number>(0);

  // NEW: Personal Details for Form 135
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [phone, setPhone] = useState("");
  const [bankId, setBankId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [accountNum, setAccountNum] = useState("");

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadedForms, setUploadedForms] = useState<AnalysisResult[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [bankSearch, setBankSearch] = useState("");
  const [docUploadStatus, setDocUploadStatus] = useState<Record<string, boolean>>({});
  const [branchSearch, setBranchSearch] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historySaved, setHistorySaved] = useState(false);

  // Save result to Supabase history
  const saveToHistory = async (analysisResult: AnalysisResult) => {
    if (!user || historySaved) return;
    try {
      await supabase.from('tax_calculations').insert({
        user_id: user.id,
        tax_year: selectedYear,
        gross_income: analysisResult.data.income,
        tax_paid: analysisResult.data.taxPaid,
        anticipated_refund: analysisResult.analysis.anticipatedRefund,
        breakdown: analysisResult.analysis.breakdown,
      });
      setHistorySaved(true);
    } catch (err) {
      console.error("Failed to save to history", err);
    }
  };

  // Fetch history from Supabase
  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('tax_calculations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
    setShowHistory(true);
  };

  // Auto-save to history when user is authenticated and result is available
  useEffect(() => {
    if (user && result && step === 5 && !historySaved) {
      saveToHistory(result);
    }
  }, [user, result, step]);
  
  // Auto-Compute Periphery Benefits Based on City
  useEffect(() => {
    if (city.trim().length > 1) {
      const benefit = getPeripheryBenefitByCity(city);
      if (benefit) {
        setLivesInPeriphery(true);
        setPeripheryPercent(benefit.percent);
        setPeripheryCeiling(benefit.ceiling);
      } else {
        setLivesInPeriphery(false);
        setPeripheryPercent(0);
        setPeripheryCeiling(0);
      }
    }
  }, [city]);

  const currentYear = new Date().getFullYear();
  const validYears = Array.from({ length: 6 }, (_, i) => currentYear - 1 - i);

  // Compute points
  const calculatedPoints = useMemo(() => {
    let pts = gender === "female" ? 2.75 : 2.25;
    const yearForMath = selectedYear || currentYear;
    pts += calculateChildPoints(childBirthYears, yearForMath, gender);

    if (singleParent) pts += 1;
    // Note: soldier and isOleh are kept as state variables for future MVP phases
    // Apply degree points conditionally based on graduation year
    if (degree !== "none" && degreeYear && selectedYear !== null) {
       const yr = parseInt(String(degreeYear));
       const startYear = yr + 1 + (degreeDeferred ? 1 : 0);
       const endYear = startYear + (degree === "bachelor" ? 2 : 1); // rough proxy: up to 3 years for BA, 2 for MA
       
       if (selectedYear >= startYear && selectedYear <= endYear) {
         if (degree === "bachelor") pts += 1;
         if (degree === "master") pts += 0.5;
       }
    }
    return pts;
  }, [gender, childBirthYears, degree, degreeYear, degreeDeferred, singleParent, selectedYear, currentYear]);

  const handleFlowSelect = (selected: FlowType) => {
    setFlow(selected);
    setStep(1);
  };

  const nextStep = () => {
    if (step === 2 && uploadingId) {
      const confirmed = window.confirm("שימו לב — תהליך חילוץ הנתונים מספח תעודת הזהות עדיין רץ ברקע.\nאם תעברו לשלב הבא עכשיו, ייתכן שהנתונים לא יעודכנו.\n\nלהמשיך בכל זאת?");
      if (!confirmed) return;
    }
    setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  // Parse ID Appendix
  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(true);
    try {
      const response = await fetch("/api/analyze-id-appendix", {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type || "image/jpeg" }
      });

      const json = await response.json();
      if (json.success) {
        if (json.firstName) setFirstName(json.firstName);
        if (json.lastName) setLastName(json.lastName);
        if (json.idNumber) setIdNumber(json.idNumber);
        
        if (json.birthYears && json.birthYears.length > 0) {
          setChildBirthYears(json.birthYears);
        }
        if (json.gender === "male" || json.gender === "female") {
          setGender(json.gender);
        }
        if (json.maritalStatus) {
           if (json.maritalStatus.includes("גרוש") || json.maritalStatus.includes("אלמ") || json.maritalStatus.includes("רווק")) {
             setSingleParent(true);
           }
        }
        if (json.city) {
          setCity(json.city);
          alert(`נתוני ספח תעודת זהות עודכנו בהצלחה!\nשם: ${json.firstName || ""} ${json.lastName || ""}\nמספר ת.ז.: ${json.idNumber || ""}\nעיר שחולצה: ${json.city}\nאנא ודאו אם מגיע לכם זיכוי פריפריה.`);
        } else if (json.birthYears && json.birthYears.length > 0) {
          alert("נתוני תעודת זהות וילדים חולצו בהצלחה!");
        } else {
          alert("הסריקה עברה אך לא חולצו נתונים חדשים מובהקים מהתמונה.");
        }
      } else {
        alert(`אירעה שגיאת סריקה: ${json.error}`);
      }
    } catch (error: any) {
      console.error(error);
      alert(`שגיאת רשת בסריקת תעודת הזהות: ${error.message || ""}`);
    } finally {
      setUploadingId(false);
    }
  };

  const handleChildAdd = () => {
    setChildBirthYears([...childBirthYears, currentYear]);
  };
  const handleChildRemove = (index: number) => {
    const arr = [...childBirthYears];
    arr.splice(index, 1);
    setChildBirthYears(arr);
  };
  const handleChildYearChange = (index: number, newYear: number) => {
    const arr = [...childBirthYears];
    arr[index] = newYear;
    setChildBirthYears(arr);
  };

  // Main Tax Form Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (selectedYear) formData.append("year", selectedYear.toString());
      formData.append("points", calculatedPoints.toString());
      
      // Expert Variables
      formData.append("donations", donations.toString());
      formData.append("lifeInsurance", lifeInsurance.toString());
      formData.append("peripheryPercent", livesInPeriphery ? peripheryPercent.toString() : "0");
      formData.append("peripheryCeiling", livesInPeriphery ? peripheryCeiling.toString() : "0");
      
      // Maternity / Birth
      formData.append("maternityAllowance", maternityAllowance.toString());
      formData.append("deferredPoint", deferredPoint.toString());

      const response = await fetch("/api/analyze-form", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();
      if (json.success) {
        const newForms = [...uploadedForms, json];
        setUploadedForms(newForms);
        // Compute aggregated result from all uploaded forms
        const totalIncome = newForms.reduce((s, f) => s + (f.data?.income || 0), 0);
        const totalTax = newForms.reduce((s, f) => s + (f.data?.taxPaid || 0), 0);
        const totalMonths = Math.min(12, newForms.reduce((s, f) => s + (f.data?.monthsWorked || 0), 0));
        const lastEmployer = newForms[newForms.length - 1];
        setResult({
          ...lastEmployer,
          data: { ...lastEmployer.data, income: totalIncome, taxPaid: totalTax, monthsWorked: totalMonths },
          analysis: lastEmployer.analysis,
        });
      } else {
        alert("אירעה שגיאה: " + json.error);
      }
    } catch (error) {
      console.error(error);
      alert("שגיאת רשת");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handlePdfDownload = async () => {
    if (!result) return;
    setDownloadingPdf(true);
    
    try {
      const payload = {
        ...result,
        year: selectedYear,
        personalData: {
          firstName, lastName, idNumber, city, street, phone, bankId, branchId, accountNum, maritalStatus,
          donations, lifeInsurance
        },
        maternityAllowance,
        deferredPoint
      };

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "כשל ביצירת קובץ ה-PDF");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      nextStep(); // Move to PDF preview step
    } catch (err) {
      console.error("PDF download failed", err);
      alert("שגיאה בהורדת הקובץ");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const containerVariants: any = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
  };

  const computeRequiredDocuments = () => {
    const docs = [];
    docs.push("טופס 106 מקורי מכל מקומות העבודה הרלוונטיים באותה שנה.");
    docs.push("צילום צ'ק מבוטל או אישור אימות חשבון בנק.");
    if (childBirthYears.length > 0) docs.push("ספח תעודת זהות המציג את פרטי הילדים.");
    if (hasDisability) docs.push("לילד/קרוב משפחה עם מוגבלות: טופס 116א ומסמכים רפואיים קבילים.");
    if (paysAlimony) docs.push("גרושים/מזונות: קביעה שיפוטית או פסק דין בדבר גירושין.");
    if (isOleh) docs.push("עולה חדש: העתק תעודת עולה.");
    if (soldier) docs.push("חייל משוחרר: צילום תעודת שחרור מצה\"ל.");
    if (didReserves) docs.push("מילואים: חובה לצרף אישורי תשלום וימי מילואים מביטוח לאומי או טופס 106 של ביטוח לאומי.");
    if (livesInPeriphery && peripheryPercent > 0) docs.push("יישובי פריפריה (טופס 1312א) ואישור תושבות הרשות המקומית.");
    if (donations > 0) docs.push("תרומות סעיף 46: קבלות מקוריות על שם מבקש ההחזר.");
    if (lifeInsurance > 0) docs.push("ביטוח חיים: אישור מחברת הביטוח על ההפקדות (אישור מס).");
    return docs;
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tax.r-hag.ai';
  const shareText = result ? `בדקתי עכשיו ומגיע לי החזר מס של ₪${Math.floor(Math.abs(result.analysis.anticipatedRefund)).toLocaleString()}! בדקו גם אתם:` : 'בדקו כמה מגיע לכם החזר מס:';
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;

  return (
    <>
      <div className="w-full max-w-3xl bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-8 backdrop-blur-xl shadow-2xl relative min-h-[400px] flex flex-col mx-auto print:hidden">
        
        <div className="flex items-center justify-between mb-2">
          {step > 0 ? (
            <button onClick={prevStep} className="p-2 rounded-full hover:bg-white/10 transition-colors text-neutral-400"><ArrowRight className="w-5 h-5" /></button>
          ) : (
            <Link href="/" className="p-2 rounded-full hover:bg-white/10 transition-colors text-neutral-400"><ArrowRight className="w-5 h-5" /></Link>
          )}
          <button onClick={() => { if(confirm('להתחיל מחדש? כל הנתונים יימחקו.')) { setStep(0); setResult(null); setUploadedForms([]); setPdfPreviewUrl(null); localStorage.removeItem(persistKey); }}} className="p-2 rounded-full hover:bg-white/10 transition-colors text-neutral-500" title="התחל מחדש"><RotateCcw className="w-4 h-4" /></button>
        </div>
        <ProgressBar currentStep={step} totalSteps={8} />

        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {step === 0 && ( /* omitted for brevity, handled implicitly by React state block */ 
              <motion.div key="step-0" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <h2 className="text-3xl font-bold text-center mb-8">מה המטרה שלנו היום?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  <button onClick={() => handleFlowSelect("refund")} className="flex flex-col items-center justify-center p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all group text-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">פעיל כעת</div>
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform"><History className="w-8 h-8" /></div>
                    <div><h3 className="text-xl font-bold mb-2">החזר מס</h3><p className="text-sm text-neutral-400">שילמתי יותר מדי ואני רוצה כסף חזרה.</p></div>
                  </button>

                  <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-white/5 bg-black/40 opacity-60 cursor-not-allowed text-center gap-4 relative overflow-hidden grayscale">
                    <div className="absolute top-4 -right-10 bg-purple-500/80 text-white text-[10px] font-bold px-10 py-1 rotate-45 transform origin-center shadow-lg uppercase tracking-wider backdrop-blur-md border-y border-purple-400/30">בקרוב</div>
                    <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center"><CalendarClock className="w-8 h-8" /></div>
                    <div><h3 className="text-xl font-bold mb-2">תיאום מס</h3><p className="text-sm text-neutral-400">מונע ניכוי מס מקסימלי השנה.</p></div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-white/5 bg-black/40 opacity-60 cursor-not-allowed text-center gap-4 relative overflow-hidden grayscale">
                    <div className="absolute top-4 -right-10 bg-green-500/80 text-white text-[10px] font-bold px-10 py-1 rotate-45 transform origin-center shadow-lg uppercase tracking-wider backdrop-blur-md border-y border-green-400/30">בקרוב</div>
                    <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center"><Building className="w-8 h-8" /></div>
                    <div><h3 className="text-xl font-bold mb-2">מס שכר דירה</h3><p className="text-sm text-neutral-400">תשלום מס שנתי על חריגת שכירות.</p></div>
                  </div>
                </div>
                
                <div className="mt-8 text-center text-sm text-neutral-400 bg-white/5 border border-white/10 rounded-xl p-4 max-w-xl mx-auto flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-right">
                    <strong>לתשומת לבכם:</strong> בגרסתה הנוכחית, המערכת מותאמת לבדיקת החזר מס <strong>אישית לשכירים בלבד</strong> (ללא בעלי עסקים עצמאיים וללא שקלול חובת הגשה זוגית).
                  </p>
                </div>
              </motion.div>
            )}

            {step === 1 && flow === "refund" && (
              <motion.div key="step-1" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6 text-center">
                <h2 className="text-3xl font-bold mb-2">באיזו שנה מדובר?</h2>
                <p className="text-neutral-400 mb-8">אפשר לבקש החזר עד 6 שנים אחורה.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                  {validYears.map(year => (
                     <button key={year} onClick={() => { setSelectedYear(year); nextStep(); }} className="py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/50 transition-colors font-semibold text-lg hover:-translate-y-1 transform duration-200">{year}</button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step-points" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6 text-right max-w-2xl mx-auto w-full">
                <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-6">
                   <div>
                     <h2 className="text-3xl font-bold mb-2">שאלון חבות המס המדויקת</h2>
                     <p className="text-neutral-400 text-sm">המערכת תמפה במדוייק את זיכוי המס שלך לפי שנת {selectedYear}.</p>
                   </div>
                   <div className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-xl text-center flex-shrink-0">
                     <span className="block text-xs uppercase font-bold tracking-wider">נקודות</span>
                     <span className="text-2xl font-black">{calculatedPoints}</span>
                   </div>
                </div>

                <div className="space-y-6 bg-black/20 p-6 rounded-2xl border border-white/5">
                  <h3 className="font-bold text-white/80 border-b border-white/10 pb-2">נתוני נקודות זיכוי (אישי)</h3>
                  
                  <div className="flex justify-between items-center gap-4">
                     <div className="flex items-center gap-3"><User className="w-5 h-5 text-neutral-400" /><span className="font-semibold">מין</span></div>
                     <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                        <button onClick={() => setGender("male")} className={`px-4 py-2 rounded-md transition-colors text-sm font-bold ${gender === "male" ? "bg-white/20 text-white" : "text-neutral-500 hover:text-white"}`}>גבר</button>
                        <button onClick={() => setGender("female")} className={`px-4 py-2 rounded-md transition-colors text-sm font-bold ${gender === "female" ? "bg-white/20 text-white" : "text-neutral-500 hover:text-white"}`}>אישה</button>
                     </div>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                     <div className="flex items-center gap-3"><span className="w-5 h-5 flex items-center justify-center text-neutral-400 text-lg">💑</span><span className="font-semibold">מצב משפחתי</span></div>
                     <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 flex-wrap justify-end">
                        <button onClick={() => setMaritalStatus("single")} className={`px-3 py-1.5 rounded-md transition-colors text-xs font-bold ${maritalStatus === "single" ? "bg-white/20 text-white" : "text-neutral-500 hover:text-white"}`}>רווק/ה</button>
                        <button onClick={() => setMaritalStatus("married")} className={`px-3 py-1.5 rounded-md transition-colors text-xs font-bold ${maritalStatus === "married" ? "bg-white/20 text-white" : "text-neutral-500 hover:text-white"}`}>נשוי/ה</button>
                        <button onClick={() => setMaritalStatus("divorced")} className={`px-3 py-1.5 rounded-md transition-colors text-xs font-bold ${maritalStatus === "divorced" ? "bg-white/20 text-white" : "text-neutral-500 hover:text-white"}`}>גרוש/ה</button>
                        <button onClick={() => setMaritalStatus("widowed")} className={`px-3 py-1.5 rounded-md transition-colors text-xs font-bold ${maritalStatus === "widowed" ? "bg-white/20 text-white" : "text-neutral-500 hover:text-white"}`}>אלמן/ה</button>
                     </div>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                     <div className="flex items-center gap-3"><span className="w-5 h-5 flex items-center justify-center text-neutral-400 text-lg">👩‍👦</span><span className="font-semibold">הורה יחיד (חד הורי)</span></div>
                     <button onClick={() => setSingleParent(!singleParent)} className={`w-12 h-6 rounded-full transition-colors relative ${singleParent ? 'bg-blue-500' : 'bg-white/10'}`}><span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${singleParent ? 'translate-x-6' : ''}`} /></button>
                  </div>

                  {gender === "male" && (
                    <div className="flex justify-between items-center gap-4">
                       <div className="flex items-center gap-3"><span className="w-5 h-5 flex items-center justify-center text-neutral-400 text-lg">🎖️</span><span className="font-semibold">שירות מילואים</span></div>
                       <button onClick={() => setDidReserves(!didReserves)} className={`w-12 h-6 rounded-full transition-colors relative ${didReserves ? 'bg-blue-500' : 'bg-white/10'}`}><span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${didReserves ? 'translate-x-6' : ''}`} /></button>
                    </div>
                  )}

                  {/* CHILDREN */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4"><Baby className="w-5 h-5 text-neutral-400" /><span className="font-semibold text-lg">ילדים (נוכחות לשנת {selectedYear})</span></div>
                    
                    <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-xl mb-4">
                      <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
                        המערכת מחשבת מס בדיוק לפי גיל הילד לאותה שנה היסטורית. הזינו את שנת הלידה, או השתמשו בOCR לחילוץ אוטומטי מהספח. (הסורק ימשוך גם עיר ומין אוטומטית!)
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={handleChildAdd} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors">
                          + הוסף ילד (שנת לידה)
                        </button>

                        <div className="relative flex-1">
                          <input type="file" onChange={handleIdUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                          <div className={`w-full h-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-colors border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white ${uploadingId ? 'bg-blue-500 text-white' : ''}`}>
                            {uploadingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                            {uploadingId ? 'סורק ספח...' : 'סורק מהיר (ספח ת.ז.)'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {childBirthYears.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {childBirthYears.map((year, idx) => (
                          <div key={idx} className="flex items-center bg-white/5 border border-white/10 rounded-lg p-2 gap-2">
                             <input type="number" value={year} onChange={(e) => handleChildYearChange(idx, parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold px-2 py-1 outline-none no-arrows text-center" />
                             <button onClick={() => handleChildRemove(idx)} className="text-neutral-500 hover:text-red-400 p-1">✕</button>
                          </div>
                        ))}
                      </div>
                     )}
                  </div>

                  {/* Birth & Maternity (Female only) */}
                  {gender === "female" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-pink-500/5 p-5 rounded-2xl border border-pink-500/20 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-pink-400">
                          <div className="p-2 bg-pink-500/20 rounded-lg">
                            <Baby className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">לידה והורות בשנה זו ({selectedYear})</h4>
                            <p className="text-xs text-neutral-400">חופשת לידה, דמי לידה ודחיית נקודות</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setGaveBirthThisYear(!gaveBirthThisYear)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${gaveBirthThisYear ? 'bg-pink-500' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${gaveBirthThisYear ? 'left-1' : 'left-7'}`} />
                        </button>
                      </div>

                      {gaveBirthThisYear && (
                        <div className="space-y-4 pt-4 border-t border-pink-500/10">
                          <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                            <label className="text-xs text-neutral-400 block mb-2 font-medium">סכום דמי לידה ברוטו (מביטוח לאומי)</label>
                            <div className="flex items-center">
                              <span className="text-neutral-500 ml-2">₪</span>
                              <input 
                                type="number" 
                                value={maternityAllowance || ""} 
                                onChange={(e) => setMaternityAllowance(parseInt(e.target.value) || 0)}
                                placeholder="לדוגמה: 35,000"
                                className="w-full bg-transparent border-none outline-none text-white font-bold text-left"
                              />
                            </div>
                          </div>

                          {/* Upload Bituach Leumi Document */}
                          <div className="relative group cursor-pointer">
                            <input 
                              type="file" 
                              accept="image/*,.pdf"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadingMaternity(true);
                                try {
                                  const fd = new FormData();
                                  fd.append("file", file);
                                  fd.append("type", "maternity");
                                  const res = await fetch("/api/extract-maternity", { method: "POST", body: fd });
                                  const json = await res.json();
                                  if (json.success && json.amount > 0) {
                                    setMaternityAllowance(json.amount);
                                  } else {
                                    alert(json.error || "לא הצלחנו לחלץ את הסכום מהמסמך. נסו להזין ידנית.");
                                  }
                                } catch {
                                  alert("שגיאת רשת");
                                } finally {
                                  setUploadingMaternity(false);
                                }
                              }}
                            />
                            <div className={`border border-dashed rounded-xl p-3 flex items-center justify-center gap-2 transition-all text-sm ${uploadingMaternity ? 'border-pink-500 bg-pink-500/5' : 'border-white/10 bg-black/20 hover:bg-black/30'}`}>
                              {uploadingMaternity ? (
                                <><Loader2 className="w-4 h-4 text-pink-400 animate-spin" /> <span className="text-pink-300">מחלץ נתונים מהמסמך...</span></>
                              ) : (
                                <><UploadCloud className="w-4 h-4 text-neutral-400" /> <span className="text-neutral-400">או: העלו אישור דמי לידה מביטוח לאומי</span></>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                              <label className="text-xs text-neutral-400 block mb-2 font-medium">חודשי חל"ת לאחר לידה</label>
                              <input 
                                type="number" 
                                value={unpaidLeaveMonths || ""} 
                                onChange={(e) => setUnpaidLeaveMonths(parseInt(e.target.value) || 0)}
                                placeholder="0"
                                className="w-full bg-transparent border-none outline-none text-white font-bold text-center"
                              />
                            </div>
                            <button 
                              onClick={() => setDeferredPoint(!deferredPoint)}
                              className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${deferredPoint ? 'bg-pink-500/20 border-pink-500/50 text-pink-400' : 'bg-black/40 border-white/5 text-neutral-400'}`}
                            >
                              <span className="text-[10px] font-bold">דחיית נקודת זיכוי</span>
                              <span className="text-[9px] leading-tight text-center opacity-70">מומלץ אם ההכנסה נמוכה (טופס 116ד')</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                <div className="pt-6 border-t border-white/10 text-left">
                   <button onClick={nextStep} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors inline-flex items-center gap-2">
                     המשך להטבות כספיות <ArrowRight className="w-4 h-4 rotate-180" />
                   </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step-financials" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6 text-right max-w-2xl mx-auto w-full">
                <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-6">
                   <div>
                     <h2 className="text-3xl font-bold mb-2">השכלה והטבות כספיות</h2>
                     <p className="text-neutral-400 text-sm">המערכת תחשב זיכויים לסטודנטים, ביטוחים, ופריפריה.</p>
                   </div>
                   <div className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-xl text-center flex-shrink-0">
                     <span className="block text-xs uppercase font-bold tracking-wider">נקודות</span>
                     <span className="text-2xl font-black">{calculatedPoints}</span>
                   </div>
                </div>

                <div className="space-y-6 bg-black/20 p-6 rounded-2xl border border-white/5">
                  {/* DEGREE */}
                  <div className="pb-4 border-b border-white/5">
                     <div className="flex items-center gap-3 mb-4"><GraduationCap className="w-5 h-5 text-neutral-400" /><span className="font-semibold text-lg">תואר אקדמי</span></div>
                     <div className="grid grid-cols-3 gap-2 mb-4">
                        <button onClick={() => setDegree("none")} className={`py-2 rounded-lg border transition-colors text-sm font-bold ${degree === "none" ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"}`}>אין</button>
                        <button onClick={() => setDegree("bachelor")} className={`py-2 rounded-lg border transition-colors text-sm font-bold ${degree === "bachelor" ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"}`}>תואר ראשון</button>
                        <button onClick={() => setDegree("master")} className={`py-2 rounded-lg border transition-colors text-sm font-bold ${degree === "master" ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"}`}>תואר שני</button>
                     </div>
                     
                     {degree !== "none" && (
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mt-3 space-y-4">
                          <div>
                            <label className="text-sm text-neutral-300 block mb-2 font-medium">באיזו שנה סיימת את התואר/הזכאות?</label>
                            <input type="number" value={degreeYear} onChange={(e) => setDegreeYear(parseInt(e.target.value) || "")} placeholder="לדוגמה: 2021" className="w-full bg-black/50 border border-blue-500/30 rounded-lg px-3 py-2 outline-none text-white font-bold text-right" />
                          </div>
                          
                          {degreeYear && (
                            <div className="text-sm bg-black/30 p-3 rounded-lg text-neutral-400 leading-relaxed text-right">
                              נקודות הזיכוי ניתנות החל מהשנה שאחרי סיום התואר (עד 3 שנים עבור תואר ראשון). 
                              ניתן לדחות את תחילת המימוש בשנה אחת נוספת.
                            </div>
                          )}
                          
                          {degreeYear && (
                            <div className="flex justify-between items-center gap-4 text-sm mt-2">
                               <span className="font-semibold">האם בחרת לדחות את המימוש בשנה?</span>
                               <button onClick={() => setDegreeDeferred(!degreeDeferred)} className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${degreeDeferred ? 'bg-blue-500' : 'bg-white/10'}`}><span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${degreeDeferred ? 'translate-x-6' : ''}`} /></button>
                            </div>
                          )}
                        </div>
                     )}
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                      <div className="flex items-center gap-3">
                         <Coins className="w-6 h-6 text-yellow-500" />
                         <div>
                           <span className="font-semibold block">תרומות (סעיף 46)</span>
                           <span className="text-xs text-neutral-400">החזר מס של 35% על סכום התרומה השנתי</span>
                         </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-neutral-500 ml-2">₪</span>
                        <input type="number" value={donations} onChange={(e) => setDonations(parseInt(e.target.value) || 0)} className="w-24 bg-black/50 border border-white/10 rounded-lg px-3 py-2 outline-none text-white font-bold focus:border-yellow-500 transition-colors text-left" />
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                      <div className="flex items-center gap-3">
                         <ShieldCheck className="w-6 h-6 text-green-500" />
                         <div>
                           <span className="font-semibold block">ביטוח חיים פרטי </span>
                           <span className="text-xs text-neutral-400">מעניק 25% זיכוי מס (הפקדה עצמאית)</span>
                         </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-neutral-500 ml-2">₪</span>
                        <input type="number" value={lifeInsurance} onChange={(e) => setLifeInsurance(parseInt(e.target.value) || 0)} className="w-24 bg-black/50 border border-white/10 rounded-lg px-3 py-2 outline-none text-white font-bold focus:border-green-500 transition-colors text-left" />
                      </div>
                    </div>
                  </div>

                  {/* EXPERT PERIPHERY DISCOUNT */}
                  <div className="pt-4 border-t border-white/10 mt-6">
                     <div className="mb-4">
                       <label className="flex items-center gap-3 mb-2"><Home className="w-5 h-5 text-neutral-400" /><span className="font-semibold">עיר מגורים (לבדיקת הנחת יישוב מוטב)</span></label>
                       <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="לדוגמה: עכו, שדרות..." className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-3 outline-none text-white font-bold text-right focus:border-blue-500 transition-colors" />
                     </div>
                     
                     <AnimatePresence>
                       {livesInPeriphery && peripheryPercent > 0 && (
                         <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl space-y-4 mb-2 overflow-hidden">
                           <div className="flex items-center gap-2 text-green-400 mb-2">
                             <CheckCircle2 className="w-5 h-5" />
                             <span className="font-bold">זכאות ליישוב מוטב הופעלה!</span>
                           </div>
                           <div className="flex flex-col sm:flex-row gap-4">
                             <div className="flex-1">
                               <label className="text-xs text-green-200 block mb-1">אחוז ההנחה ליישוב</label>
                               <div className="flex items-center">
                                 <input type="number" value={peripheryPercent} onChange={(e) => setPeripheryPercent(parseFloat(e.target.value) || 0)} className="w-full bg-black/50 border border-green-500/30 rounded-lg px-3 py-2 outline-none text-white font-bold text-left focus:border-green-500 transition-colors" />
                                 <span className="text-neutral-400 mr-2">%</span>
                               </div>
                             </div>
                             <div className="flex-1">
                               <label className="text-xs text-green-200 block mb-1">תקרת הכנסה מותרת ביישוב</label>
                               <div className="flex items-center">
                                 <span className="text-neutral-400 ml-2">₪</span>
                                 <input type="number" value={peripheryCeiling} onChange={(e) => setPeripheryCeiling(parseInt(e.target.value) || 0)} className="w-full bg-black/50 border border-green-500/30 rounded-lg px-3 py-2 outline-none text-white font-bold text-left focus:border-green-500 transition-colors" />
                               </div>
                             </div>
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/10 text-left">
                   <button onClick={nextStep} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors inline-flex items-center gap-2">
                     המשך להעלאת מסמכים <ArrowRight className="w-4 h-4 rotate-180" />
                   </button>
                </div>

              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step-upload" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="text-center space-y-6 py-4">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">בואו נעלה את מסמכי ההכנסות</h2>
                
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 sm:p-6 text-right max-w-lg mx-auto mb-6">
                  <h3 className="font-semibold text-blue-400 mb-2 border-b border-white/10 pb-2">מה להעלות עכשיו?</h3>
                  <p className="text-neutral-300 mb-4 leading-relaxed text-sm">טפסי 106 מקוריים ממעסיקים, או אישורי תשלום מביטוח לאומי (לדוגמה: על דמי לידה) המעידים על הכנסה בשנת {selectedYear}.</p>
                </div>

                {/* Already uploaded forms list */}
                {uploadedForms.length > 0 && (
                  <div className="max-w-lg mx-auto space-y-2 mb-4">
                    {uploadedForms.map((form, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-right">
                        <div>
                          <span className="text-sm font-bold text-green-400">{form.data.employerName || `טופס ${idx + 1}`}</span>
                          <span className="text-xs text-neutral-400 mr-3">₪{form.data.income?.toLocaleString()} | {form.data.monthsWorked} חודשים</span>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      </div>
                    ))}
                    <div className="text-xs text-neutral-400 text-right pt-1">
                      סה"כ מ-{uploadedForms.length} טפסים: הכנסה ₪{uploadedForms.reduce((s, f) => s + (f.data?.income || 0), 0).toLocaleString()} | מס ₪{uploadedForms.reduce((s, f) => s + (f.data?.taxPaid || 0), 0).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Upload area */}
                <div className="space-y-4 max-w-lg mx-auto">
                  {computeRequiredDocuments().map((doc, idx) => {
                    const is106 = doc.includes("106 מקורי");
                    if (is106) {
                      return (
                        <div key={idx} className="relative group cursor-pointer w-full">
                          <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept="image/*,.pdf" />
                          <div className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center transition-all duration-300 ${uploadingDoc ? 'border-blue-500 bg-blue-500/5' : 'border-white/20 bg-white/5 hover:border-blue-500/50 hover:bg-white/10'}`}>
                            {uploadingDoc ? (
                              <><Loader2 className="w-8 h-8 text-blue-500 mb-3 animate-spin" /><h3 className="text-lg font-semibold mb-1">מנתח אוטומטית...</h3></>
                            ) : (
                              <><UploadCloud className="w-8 h-8 text-neutral-400 mb-3" /><h3 className="text-lg font-semibold mb-1 text-center">{doc}</h3><p className="text-xs text-neutral-500">יוזן אוטומטית למערכת (OCR)</p></>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      const isUploaded = docUploadStatus[doc];
                      return (
                        <div key={idx} className="relative group cursor-pointer w-full">
                          <input type="file" onChange={(e) => {
                            if (e.target.files?.[0]) setDocUploadStatus(prev => ({...prev, [doc]: true}));
                          }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept="image/*,.pdf" />
                          <div className={`border rounded-2xl p-4 flex items-center justify-between transition-all duration-300 ${isUploaded ? 'bg-green-500/10 border-green-500/30' : 'bg-black/40 border-white/10 hover:border-white/30'}`}>
                            <div className="flex items-center gap-3 pr-2">
                              {isUploaded ? <CheckCircle2 className="w-6 h-6 text-green-400" /> : <UploadCloud className="w-6 h-6 text-neutral-500" />}
                              <span className={`text-sm font-medium leading-tight ${isUploaded ? 'text-green-300' : 'text-neutral-300'}`}>{doc}</span>
                            </div>
                            {!isUploaded && <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-neutral-400 whitespace-nowrap ml-2">בחר קובץ</span>}
                            {isUploaded && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded whitespace-nowrap ml-2">הועלה בהצלחה</span>}
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>

                {uploadedForms.length > 0 && (
                  <button onClick={nextStep} className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl transition-colors mt-4 inline-flex items-center gap-2">צפו בתוצאות השערוך <ArrowRight className="w-4 h-4 rotate-180" /></button>
                )}
              </motion.div>
            )}

            {/* STEP 5: Results */}
            {step === 5 && result && (
               <motion.div key="step-results" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="w-full text-right">
                  <>
                    <div className="text-center mb-8">
                      <h2 className="text-2xl sm:text-4xl font-bold mb-2">שקלול החזר מס רשמי</h2>
                      <p className="text-neutral-400 text-sm">התוצאה נמדדת לפי חוקי המס של {selectedYear}.</p>
                      {user && (
                        <button onClick={fetchHistory} className="mt-3 text-xs text-blue-400 hover:underline inline-flex items-center gap-1"><Clock className="w-3 h-3" /> היסטוריית חישובים</button>
                      )}
                    </div>

                    {/* History Modal */}
                    {showHistory && (
                      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowHistory(false)}>
                        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[70vh] overflow-auto" onClick={e => e.stopPropagation()}>
                          <h3 className="text-xl font-bold mb-4 text-right">היסטוריית חישובים</h3>
                          {history.length === 0 ? (
                            <p className="text-neutral-400 text-sm text-center py-8">אין חישובים קודמים.</p>
                          ) : (
                            <div className="space-y-3">
                              {history.map((h: any) => (
                                <div key={h.id} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                                  <div className="text-right">
                                    <div className="font-bold text-sm">שנת מס {h.tax_year}</div>
                                    <div className="text-xs text-neutral-400">הכנסה: ₪{Number(h.gross_income).toLocaleString()} | מס: ₪{Number(h.tax_paid).toLocaleString()}</div>
                                    <div className="text-xs text-neutral-500">{new Date(h.created_at).toLocaleDateString('he-IL')}</div>
                                  </div>
                                  <div className={`text-lg font-black ${Number(h.anticipated_refund) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ₪{Math.floor(Math.abs(Number(h.anticipated_refund))).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <button onClick={() => setShowHistory(false)} className="mt-4 w-full py-2 bg-white/10 rounded-xl text-sm hover:bg-white/20">סגור</button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-neutral-900/60 p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                        <h3 className="text-lg font-bold mb-2 text-white/80">
                          {result.analysis.anticipatedRefund >= 0 ? 'החזר משוער לאחר ניכויים' : '⚠️ חוב מס משוער'}
                        </h3>
                        <div className="bg-black/40 rounded-xl p-4 text-center mt-4">
                          {result.analysis.anticipatedRefund >= 0 ? (
                            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-green-400 to-emerald-500">
                              ₪{Math.floor(result.analysis.anticipatedRefund).toLocaleString()}
                            </span>
                          ) : (
                            <>
                              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-red-400 to-orange-500">
                                -₪{Math.floor(Math.abs(result.analysis.anticipatedRefund)).toLocaleString()}
                              </span>
                              <p className="text-sm text-red-300 mt-3">שילמת פחות מדי מס השנה. ייתכן שתידרש לתשלום נוסף.</p>
                            </>
                          )}
                        </div>
                        <div className="mt-6 border-t border-white/5 pt-4">
                          <button 
                            onClick={() => setShowAudit(!showAudit)}
                            className="text-sm text-blue-400 underline hover:text-blue-300 transition-colors"
                          >
                            {showAudit ? 'הסתר פירוט חישוב' : 'הצג פירוט חישוב מלא'}
                          </button>
                          
                          <AnimatePresence>
                            {showAudit && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4">
                                <div className="space-y-4 text-xs bg-black/40 p-4 rounded-xl border border-white/5 text-right">
                                  <div>
                                    <h4 className="font-bold text-blue-400 mb-2 border-b border-white/10 pb-1">נתונים שחולצו (Inputs)</h4>
                                    <ul className="text-neutral-300 space-y-1">
                                      <li><span className="text-neutral-500">הכנסה שנתית ברוטו:</span> {result.data.income} ₪</li>
                                      <li><span className="text-neutral-500">מס ששולם בפועל:</span> {result.data.taxPaid} ₪</li>
                                      <li><span className="text-neutral-500">חודשי עבודה:</span> {result.data.monthsWorked}</li>
                                      <li><span className="text-neutral-500">נקודות זיכוי אישיות:</span> {calculatedPoints}</li>
                                    </ul>
                                  </div>

                                  {result.analysis.breakdown && (
                                    <div>
                                      <h4 className="font-bold text-green-400 mb-2 border-b border-white/10 pb-1">לוגיקת חישוב (Math Logic)</h4>
                                      <div className="space-y-1 text-neutral-300 font-mono text-[11px] leading-relaxed">
                                        {result.analysis.breakdown.map((line: string, idx: number) => ( 
                                          <p key={idx}>[step {idx+1}] {line}</p> 
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h3 className="text-lg font-bold mb-4 text-orange-400 flex items-center gap-2"><FileDown className="w-5 h-5" /> רשימת מסמכים להגשה</h3>
                        <div className="space-y-3 text-sm text-neutral-300">
                          {computeRequiredDocuments().map((doc: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 bg-black/40 p-3 rounded-lg border border-white/5">
                              <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                              <span className="leading-snug">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* AUTH + PAYMENT GATE: Continue to Form 135 */}
                    <div className="pt-6 border-t border-white/10">
                      {(user || BYPASS_AUTH) ? (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                          <button onClick={nextStep} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2">
                            המשך למילוי טופס 135 הרשמי <ArrowRight className="w-4 h-4 rotate-180" />
                          </button>
                          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex items-center gap-2 text-sm">
                            <Share2 className="w-4 h-4" /> שתף ב-WhatsApp
                          </a>
                        </div>
                      ) : (
                        <div className="max-w-md mx-auto text-center py-6 px-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                          <h3 className="text-xl font-bold mb-3">רוצים לקבל את הטופס המוכן?</h3>
                          <p className="text-sm text-neutral-400 mb-4">התחברו כדי לקבל טופס 135 מוכן להגשה + הנחיות לקבלת ההחזר.</p>
                          <button 
                            onClick={handleLogin}
                            className="w-full h-12 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all shadow-lg mb-3"
                          >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                            התחבר עם Google
                          </button>
                          <p className="text-xs text-neutral-500">לאחר ההתחברות תועברו לתשלום וקבלת הטופס.</p>
                        </div>
                      )}
                    </div>
                  </>
              </motion.div>
            )}

            {/* STEP 6: PERSONAL DATA CAPTURE -> PDF DOWNLAD */}
            {step === 6 && (
              <motion.div key="step-personal" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="w-full text-right space-y-6">
                <div>
                   <h2 className="text-3xl font-bold mb-2">פרטים אישיים לטובת הטופס</h2>
                   <p className="text-neutral-400 text-sm">הטופס הרשמי של מס הכנסה דורש את נתוניך כדי שיוכלו להפקיד את הכסף. המערכת תדפיס אותם בדיוק במקומות הנדרשים בטופס הPDF.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Identity */}
                  <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5">
                    <h3 className="font-bold flex items-center gap-2 text-white/80"><User className="w-4 h-4" /> זהות</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">שם משפחה <span className="text-red-400">*</span></label>
                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={`w-full bg-white/5 border rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors ${!lastName ? 'border-red-500/50' : 'border-white/10'}`} />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">שם פרטי <span className="text-red-400">*</span></label>
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={`w-full bg-white/5 border rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors ${!firstName ? 'border-red-500/50' : 'border-white/10'}`} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">מספר תעודת זהות (9 ספרות) <span className="text-red-400">*</span></label>
                      <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)} maxLength={9} className={`w-full bg-white/5 border rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-left ${!idNumber ? 'border-red-500/50' : 'border-white/10'}`} dir="ltr" />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5">
                    <h3 className="font-bold flex items-center gap-2 text-white/80"><MapPin className="w-4 h-4" /> התקשרות וכתובת</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-neutral-400 block mb-1">יישוב מגורים <span className="text-red-400">*</span></label>
                        <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="לדוגמה: תל אביב" className={`w-full bg-white/5 border rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors ${!city ? 'border-red-500/50' : 'border-white/10'}`} />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">רחוב ומספר בית <span className="text-red-400">*</span></label>
                        <input type="text" value={street} onChange={e => setStreet(e.target.value)} className={`w-full bg-white/5 border rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors ${!street ? 'border-red-500/50' : 'border-white/10'}`} />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">טלפון נייד <span className="text-red-400">*</span></label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={`w-full bg-white/5 border rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-left ${!phone ? 'border-red-500/50' : 'border-white/10'}`} dir="ltr" />
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5 md:col-span-2">
                    <h3 className="font-bold flex items-center gap-2 text-white/80"><Building className="w-4 h-4" /> פרטי חשבון בנק (לאן יועבר ההחזר?)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Bank Selector */}
                      <div className="relative">
                        <label className="text-xs text-neutral-400 block mb-1">בנק</label>
                        <input 
                          type="text" 
                          value={bankSearch || (bankId ? BANKS.find(b => b.code === bankId)?.name || bankId : '')}
                          onChange={e => { setBankSearch(e.target.value); setShowBankDropdown(true); }}
                          onFocus={() => { setBankSearch(''); setShowBankDropdown(true); }}
                          placeholder="חפשו בנק..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-sm"
                        />
                        {showBankDropdown && (
                          <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-xl max-h-48 overflow-auto shadow-xl">
                            {BANKS.filter(b => !bankSearch || b.name.includes(bankSearch) || b.code.includes(bankSearch)).map(bank => (
                              <button key={bank.code} onClick={() => { setBankId(bank.code); setBankSearch(''); setBranchId(''); setShowBankDropdown(false); }} className="w-full text-right px-3 py-2 hover:bg-white/10 text-sm flex items-center justify-between">
                                <span>{bank.name}</span>
                                <span className="text-xs text-neutral-500">{bank.code}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Branch Selector */}
                      <div className="relative">
                        <label className="text-xs text-neutral-400 block mb-1">סניף</label>
                        <input 
                          type="text" 
                          value={branchSearch || (branchId ? (getBranchesForBank(bankId).find(b => b.branchCode === branchId)?.name || branchId) : '')}
                          onChange={e => { setBranchSearch(e.target.value); setShowBranchDropdown(true); }}
                          onFocus={() => { setBranchSearch(''); setShowBranchDropdown(true); }}
                          placeholder={bankId ? 'חפשו סניף...' : 'בחרו בנק קודם'}
                          disabled={!bankId}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-sm disabled:opacity-40"
                        />
                        {showBranchDropdown && bankId && (
                          <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-xl max-h-48 overflow-auto shadow-xl">
                            {getBranchesForBank(bankId).filter(b => !branchSearch || b.name.includes(branchSearch) || b.branchCode.includes(branchSearch) || b.city.includes(branchSearch)).map(branch => (
                              <button key={branch.branchCode} onClick={() => { setBranchId(branch.branchCode); setBranchSearch(''); setShowBranchDropdown(false); }} className="w-full text-right px-3 py-2 hover:bg-white/10 text-sm flex items-center justify-between">
                                <span>{branch.name} - {branch.city}</span>
                                <span className="text-xs text-neutral-500">{branch.branchCode}</span>
                              </button>
                            ))}
                            {getBranchesForBank(bankId).length === 0 && (
                              <div className="px-3 py-2 text-xs text-neutral-500">אין סניפים במאגר — הזינו מספר סניף ידנית</div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">מספר חשבון בנק <span className="text-red-400">*</span></label>
                        <input type="text" value={accountNum} onChange={e => setAccountNum(e.target.value)} className={`w-full bg-white/5 border rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-center ${!accountNum ? 'border-red-500/50' : 'border-white/10'}`} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
                   <div className="text-right">
                     <h4 className="font-bold text-lg mb-1">חולל טופס 135 סופי להתקשרות</h4>
                     <p className="text-sm text-neutral-400 mt-1">המערכת צורבת את נתוני הזהות, החישוב והבנק למקומות המדויקים בPDF בפיקסלים.</p>
                     {(!lastName || !firstName || !idNumber || !city || !street || !phone || !bankId || !branchId || !accountNum) && (
                       <p className="text-xs text-red-400 mt-2">⚠ יש למלא את כל השדות לפני הורדת הטופס.</p>
                     )}
                   </div>
                   <button onClick={handlePdfDownload} disabled={downloadingPdf || !lastName || !firstName || !idNumber || !city || !street || !phone || !bankId || !branchId || !accountNum} className="flex-shrink-0 px-8 py-4 bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center gap-3 transition-opacity">
                      {downloadingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />} הורד מסמך PDF מוכן
                   </button>
                </div>
              </motion.div>
            )}

            {/* STEP 7: PDF PREVIEW */}
            {step === 7 && pdfPreviewUrl && (
              <motion.div key="step-pdf-preview" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="w-full text-center space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">תצוגה מקדימה של הטופס</h2>
                  <p className="text-neutral-400 text-sm">בדקו שהנתונים נכונים. אם הכל תקין — הורידו את הטופס.</p>
                </div>

                <div className="flex items-center justify-center gap-3 mb-2">
                  <button onClick={() => setPdfZoom(Math.max(50, pdfZoom - 25))} className="px-3 py-1 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">−</button>
                  <span className="text-neutral-400 text-sm font-mono">{pdfZoom}%</span>
                  <button onClick={() => setPdfZoom(Math.min(200, pdfZoom + 25))} className="px-3 py-1 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">+</button>
                </div>

                <div className="bg-white rounded-xl overflow-auto max-h-[60vh] mx-auto" style={{ maxWidth: '800px' }}>
                  <iframe src={pdfPreviewUrl} style={{ width: `${pdfZoom}%`, height: '80vh', border: 'none', transformOrigin: 'top center' }} title="PDF Preview" />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <a href={pdfPreviewUrl} download={`Official_Form_135_${selectedYear}.pdf`} className="px-8 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl inline-flex items-center gap-2 transition-colors">
                    <FileDown className="w-5 h-5" /> הורד את הטופס
                  </a>
                  <button onClick={nextStep} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl inline-flex items-center gap-2 transition-colors">
                    מה עכשיו? <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 8: WHAT NOW — FINAL */}
            {step === 8 && (
              <motion.div key="step-final" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="w-full text-right space-y-6 max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">🎉 הטופס מוכן — מה עכשיו?</h2>
                  <p className="text-neutral-400 text-sm">זהו. הטופס שלכם מוכן. עכשיו נותר רק להגיש אותו לרשות המסים.</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><span className="bg-blue-500/20 text-blue-400 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black">1</span> הגשה דיגיטלית (מומלץ)</h3>
                    <p className="text-neutral-300 text-sm leading-relaxed">היכנסו לאתר רשות המסים בכתובת <a href="https://www.gov.il/he/service/annual-tax-return" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold">gov.il/taxes</a>. היכנסו עם הזדהות חכמה, העלו את הטופס, וחתמו דיגיטלית.</p>
                  </div>

                  <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><span className="bg-blue-500/20 text-blue-400 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black">2</span> הגשה פיזית (חלופה)</h3>
                    <p className="text-neutral-300 text-sm leading-relaxed">הדפיסו את הטופס, חתמו בעט, צרפו את כל האסמכתאות (106, צ'ק מבוטל, אישורי ביטוח לאומי) והגישו בסניף רשות המסים הקרוב למקום מגוריכם.</p>
                  </div>

                  <div className="bg-black/20 border border-white/5 rounded-2xl p-5">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><span className="bg-blue-500/20 text-blue-400 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black">3</span> מסמכים נלווים</h3>
                    <div className="text-neutral-300 text-sm leading-relaxed">
                      <ul className="space-y-1 list-disc mr-4">
                        {computeRequiredDocuments().map((doc, idx) => (
                          <li key={idx}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
                    <h3 className="font-bold text-lg mb-2 text-green-400 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> לוחות זמנים</h3>
                    <p className="text-neutral-300 text-sm leading-relaxed">ניתן להגיש דוח שנתי עד 6 שנים אחורה. ההחזר מועבר לחשבון הבנק שהזנתם תוך 90 יום עסקים מיום אישור הדוח.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-white/10">
                  {pdfPreviewUrl && (
                    <a href={pdfPreviewUrl} download={`Official_Form_135_${selectedYear}.pdf`} className="px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl inline-flex items-center gap-2 transition-colors">
                      <FileDown className="w-4 h-4" /> הורד שוב את הטופס
                    </a>
                  )}
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex items-center gap-2 text-sm">
                    <Share2 className="w-4 h-4" /> שתף ב-WhatsApp
                  </a>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
      {result && step < 6 && <PrintableSummary result={result!} year={selectedYear} />}
    </>
  );
}
