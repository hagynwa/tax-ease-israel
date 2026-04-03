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
  }
}

export default function PrintableSummary({ result, year }: { result: AnalysisResult, year: number | null }) {
  if (!result) return null;

  return (
    <div className="hidden print:block w-full text-black bg-white !p-12 min-h-screen text-right" dir="rtl">
      
      {/* Official Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-12">
        <div>
          <h1 className="text-3xl font-bold mb-2">סיכום נתונים - החזר מס</h1>
          <p className="text-gray-600">הופק באמצעות ממשק TaxEase</p>
        </div>
        <div className="text-left text-sm text-gray-500">
          תאריך הפקה: {new Date().toLocaleDateString('he-IL')}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-bold mb-4 underline">הנחיות הגשה לאתר gov.il (טופס 135)</h2>
        <ol className="list-decimal list-inside space-y-3">
          <li>יש להתחבר לאזור האישי הממשלתי (gov.il) ולחפש "הגשת דוח מקוון למס הכנסה (טופס 135)".</li>
          <li>יש להקליד את הנתונים המפורטים מטה בסעיפים המתאימים בדיוק.</li>
          <li>יש לצרף את תמונות או קבצי טופס 106 הסרוקים שהזנת למערכת.</li>
          <li>מומלץ לבקש במערכת כי המספר יוזן ישירות לחשבון הבנק העדכני.</li>
        </ol>
      </div>

      {/* Extracted Data Section */}
      <div className="border border-gray-300 rounded-lg p-6 mb-12">
        <h3 className="text-xl font-bold mb-6 text-center bg-gray-100 p-2 rounded">1. נתוני משכורת וישויות</h3>
        <div className="grid grid-cols-2 gap-y-4">
          <div className="font-semibold text-gray-600">שנת מס:</div>
          <div className="font-bold">{year}</div>

          <div className="font-semibold text-gray-600">שם המעסיק:</div>
          <div className="font-bold">{result.data.employerName || "לא זוהה"}</div>

          <div className="font-semibold text-gray-600">מספר תיק ניכויים של המעסיק:</div>
          <div className="font-bold">{result.data.employerId || "לא זוהה"}</div>

          <div className="font-semibold text-gray-600">הכנסה כוללת (סעיפים 158/172):</div>
          <div className="font-bold text-lg">₪{result.data.income.toLocaleString()}</div>
          
          <div className="font-semibold text-gray-600">מס הכנסה שנוכה במקור (סעיף 042):</div>
          <div className="font-bold text-lg">₪{result.data.taxPaid.toLocaleString()}</div>
        </div>
      </div>

      {/* Tax Engine Results Section */}
      <div className="border border-gray-300 rounded-lg p-6 mb-12">
        <h3 className="text-xl font-bold mb-6 text-center bg-black text-white p-2 rounded">2. סיכום התחשיב - רשות המסים</h3>
        <div className="grid grid-cols-2 gap-y-4 items-center">
          <div className="font-semibold text-gray-600">מס מחויב (לאחר קיזוז נקודות זכות):</div>
          <div className="font-bold text-lg">₪{Math.floor(result.analysis.taxOwed).toLocaleString()}</div>

          <div className="font-semibold text-gray-600 py-4 border-t border-gray-200 mt-2">מס עודף ששולם במקור:</div>
          <div className="font-black text-3xl py-4 border-t border-gray-200 mt-2">
            ₪{Math.floor(result.analysis.anticipatedRefund).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500 text-center mt-16 pt-8 border-t border-gray-200">
        הערה משפטית: התחשיב בטופס זה הינו שערוך ממוחשב שנוצר על ידי ניתוח תמונה באמצעות מודל מתקדם, ואינו מהווה ייעוץ מס או חוות דעת משפטית מחייבת. התוצאה הסופית נקבעת בלעדית על ידי פקיד השומה. 
      </div>

    </div>
  );
}
