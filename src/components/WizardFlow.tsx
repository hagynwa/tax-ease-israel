"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, History, CalendarClock, UploadCloud, FileType2, Loader2, CheckCircle2, FileDown, Info, User, GraduationCap, Baby, Award, HeartPulse, Scale, Home, Plane, Camera, Coins, ShieldCheck, MapPin, Building, CreditCard } from "lucide-react";
import Link from "next/link";
import PrintableSummary from "./PrintableSummary";
import { calculateChildPoints } from "@/lib/taxCalculator";
import { getPeripheryBenefitByCity } from "@/lib/peripheryMap";
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
  const [degreeUsed, setDegreeUsed] = useState(false);
  const [soldier, setSoldier] = useState(false);
  const [singleParent, setSingleParent] = useState(false);

  // Advanced Demographics
  const [isOleh, setIsOleh] = useState(false);
  const [hasDisability, setHasDisability] = useState(false); 
  const [paysAlimony, setPaysAlimony] = useState(false); 
  
  // Maternity & Birth
  const [gaveBirthThisYear, setGaveBirthThisYear] = useState(false);
  const [maternityAllowance, setMaternityAllowance] = useState<number>(0);
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
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  
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
    if (soldier) pts += 1;
    if (!degreeUsed) {
      if (degree === "bachelor") pts += 1;
      if (degree === "master") pts += 0.5;
    }
    if (isOleh) pts += 1; 
    return pts;
  }, [gender, childBirthYears, degree, degreeUsed, soldier, singleParent, isOleh, selectedYear, currentYear]);

  const handleFlowSelect = (selected: FlowType) => {
    setFlow(selected);
    setStep(1);
  };

  const nextStep = () => setStep(s => s + 1);
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
        setResult(json);
        setUploadSuccess(true);
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
          firstName, lastName, idNumber, city, street, phone, bankId, branchId, accountNum
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
      const a = document.createElement("a");
      a.href = url;
      a.download = `Official_Form_135_${selectedYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
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
    if (livesInPeriphery && peripheryPercent > 0) docs.push("יישובי פריפריה (טופס 1312א) ואישור תושבות הרשות המקומית.");
    if (donations > 0) docs.push("תרומות סעיף 46: קבלות מקוריות על שם מבקש ההחזר.");
    if (lifeInsurance > 0) docs.push("ביטוח חיים: אישור מחברת הביטוח על ההפקדות (אישור מס).");
    return docs;
  };

  return (
    <>
      <div className="w-full max-w-3xl bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative min-h-[400px] flex flex-col mx-auto print:hidden">
        
        <div className="flex items-center justify-between mb-8">
          {step > 0 ? (
            <button onClick={prevStep} className="p-2 rounded-full hover:bg-white/10 transition-colors text-neutral-400"><ArrowRight className="w-5 h-5" /></button>
          ) : (
            <Link href="/" className="p-2 rounded-full hover:bg-white/10 transition-colors text-neutral-400"><ArrowRight className="w-5 h-5" /></Link>
          )}
          <div className="text-sm font-medium text-neutral-500">שלב {step + 1}</div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {step === 0 && ( /* omitted for brevity, handled implicitly by React state block */ 
              <motion.div key="step-0" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <h2 className="text-3xl font-bold text-center mb-8">מה המטרה שלנו היום?</h2>
                <div className="flex flex-col gap-4 max-w-sm mx-auto">
                  <button onClick={() => handleFlowSelect("refund")} className="flex flex-col items-center justify-center p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/50 transition-all group text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform"><History className="w-8 h-8" /></div>
                    <div><h3 className="text-xl font-bold mb-2">החזר מס</h3><p className="text-sm text-neutral-400">שילמתי יותר מדי מס ואני רוצה כסף חזרה.</p></div>
                  </button>
                  {/* Disabled for MVP (Do not delete)
                  <button onClick={() => handleFlowSelect("coordination")} className="flex flex-col items-center justify-center p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all group text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform"><CalendarClock className="w-8 h-8" /></div>
                    <div><h3 className="text-xl font-bold mb-2">תיאום מס</h3><p className="text-sm text-neutral-400">מונע ניכוי מס מקסימלי השנה.</p></div>
                  </button>
                  */}
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
                     <div className="flex items-center gap-3"><span className="w-5 h-5 flex items-center justify-center text-neutral-400 text-lg">👩‍👦</span><span className="font-semibold">הורה יחיד (חד הורי)</span></div>
                     <button onClick={() => setSingleParent(!singleParent)} className={`w-12 h-6 rounded-full transition-colors relative ${singleParent ? 'bg-blue-500' : 'bg-white/10'}`}><span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${singleParent ? 'translate-x-6' : ''}`} /></button>
                  </div>

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
                <h2 className="text-3xl font-bold mb-4">בואו נעלה את מסמכי ההכנסות</h2>
                
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 text-right max-w-lg mx-auto mb-6">
                  <h3 className="font-semibold text-blue-400 mb-2 border-b border-white/10 pb-2">מה להעלות עכשיו?</h3>
                  <p className="text-neutral-300 mb-4 leading-relaxed">טפסי 106 מקוריים ממעסיקים, או אישורי תשלום מביטוח לאומי (לדוגמה: על דמי לידה) המעידים על הכנסה בשנת {selectedYear}.</p>
                </div>

                {!uploadSuccess ? (
                  <div className="relative group cursor-pointer max-w-lg mx-auto">
                    <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept="image/*,.pdf" />
                    <div className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all duration-300 ${uploadingDoc ? 'border-blue-500 bg-blue-500/5' : 'border-white/20 bg-white/5'}`}>
                      {uploadingDoc ? (
                        <><Loader2 className="w-12 h-12 text-blue-500 mb-4 animate-spin" /><h3 className="text-xl font-semibold mb-1">הבינה המלאכותית מנתחת...</h3></>
                      ) : (
                        <><UploadCloud className="w-12 h-12 text-neutral-400 mb-4" /><h3 className="text-xl font-semibold mb-1">העלאת קובץ</h3></>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border border-green-500/30 bg-green-500/10 rounded-3xl p-10 flex flex-col items-center justify-center max-w-lg mx-auto">
                    <CheckCircle2 className="w-14 h-14 text-green-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">חישוב הושלם!</h3>
                    <button onClick={nextStep} className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl transition-colors mt-6">צפו בתוצאות השערוך</button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 5: Results */}
            {step === 5 && result && (
               <motion.div key="step-results" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="w-full text-right">
                {!user ? (
                  /* LOCKED GATEWAY */
                  <div className="max-w-xl mx-auto text-center py-12 px-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md relative overflow-hidden">
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 blur-[60px] rounded-full" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 blur-[60px] rounded-full" />
                    
                    <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400 border border-blue-500/20">
                      <ShieldCheck className="w-10 h-10" />
                    </div>
                    
                    <h2 className="text-3xl font-black mb-4">התוצאות שלך מוכנות!</h2>
                    <p className="text-neutral-300 mb-8 leading-relaxed">
                      כדי לצפות בשווי החזר המס המדויק שלך ולשמור את הנתונים לעדכון עתידי, עליך להתחבר באמצעות חשבון Google. 
                      <br />
                      <span className="text-blue-400 font-semibold italic text-sm">(התהליך לוקח 5 שניות בלבד)</span>
                    </p>
                    
                    <button 
                      onClick={handleLogin}
                      className="w-full h-14 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all shadow-xl"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                      התחבר עם Google וחשוף את ההחזר שלי
                    </button>
                    
                    <div className="mt-8 flex items-center justify-center gap-6 text-xs text-neutral-500">
                      <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> מאובטח SSL</div>
                      <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> פרטיות מובטחת</div>
                    </div>
                  </div>
                ) : (
                  /* UNLOCKED RESULTS */
                  <>
                    <div className="text-center mb-8">
                      <h2 className="text-4xl font-bold mb-2">שקלול החזר מס רשמי</h2>
                      <p className="text-neutral-400">שלום {user.user_metadata?.full_name || user.email}, התוצאה נמדדת משפטית לחוקי המס של {selectedYear}.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-neutral-900/60 p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                        <h3 className="text-lg font-bold mb-2 text-white/80">החזר משוער לאחר ניכויים</h3>
                        <div className="bg-black/40 rounded-xl p-4 text-center mt-4">
                          <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-green-400 to-emerald-500">
                            ₪{Math.floor(result.analysis.anticipatedRefund).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-6 border-t border-white/5 pt-4">
                          <button 
                            onClick={() => setShowAudit(!showAudit)}
                            className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-neutral-300 font-bold transition-colors flex justify-center items-center gap-2"
                          >
                            <Info className="w-4 h-4" />
                            {showAudit ? "הסתר פירוט נתונים וחישוב" : "הצג פירוט נתונים וחישוב (לצרכי בקרה)"}
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

                    <div className="pt-6 border-t border-white/10 text-left">
                      <button onClick={nextStep} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2">
                        המשך למילוי טופס 135 הרשמי <ArrowRight className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  </>
                )}
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
                        <label className="text-xs text-neutral-400 block mb-1">שם משפחה</label>
                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">שם פרטי</label>
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">מספר תעודת זהות (9 ספרות)</label>
                      <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)} maxLength={9} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-left" dir="ltr" />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5">
                    <h3 className="font-bold flex items-center gap-2 text-white/80"><MapPin className="w-4 h-4" /> התקשרות וכתובת</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-neutral-400 block mb-1">יישוב מגורים</label>
                        <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="לדוגמה: תל אביב" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">רחוב ומספר בית</label>
                        <input type="text" value={street} onChange={e => setStreet(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">טלפון נייד</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-left" dir="ltr" />
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5 md:col-span-2">
                    <h3 className="font-bold flex items-center gap-2 text-white/80"><Building className="w-4 h-4" /> פרטי חשבון בנק (לאן יועבר ההחזר?)</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">קוד בנק</label>
                        <input type="text" value={bankId} onChange={e => setBankId(e.target.value)} placeholder="למשל 12" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-center" />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">מספר סניף</label>
                        <input type="text" value={branchId} onChange={e => setBranchId(e.target.value)} placeholder="למשל 112" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-center" />
                      </div>
                      <div>
                        <label className="text-xs text-neutral-400 block mb-1">מספר חשבון בנק</label>
                        <input type="text" value={accountNum} onChange={e => setAccountNum(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors text-center" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
                   <div className="text-right">
                     <h4 className="font-bold text-lg mb-1">חולל טופס 135 סופי להתקשרות</h4>
                     <p className="text-sm text-neutral-400 mt-1">המערכת צורבת את נתוני הזהות, החישוב והבנק למקומות המדויקים בPDF בפיקסלים.</p>
                   </div>
                   <button onClick={handlePdfDownload} disabled={downloadingPdf} className="flex-shrink-0 px-8 py-4 bg-green-500 hover:bg-green-400 text-white rounded-xl font-bold flex items-center gap-3">
                      {downloadingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />} הורד מסמך PDF מוכן
                   </button>
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
