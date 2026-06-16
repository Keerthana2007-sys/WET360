import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { Heart, IndianRupee, QrCode, CreditCard, ShieldCheck, Download, Award } from 'lucide-react';
import { translations, Language } from '../translations';

interface Campaign {
  id: number;
  title: string;
  description: string;
  target_amount: number;
  raised_amount: number;
  status: 'Active' | 'Completed';
}

interface DonationResponse {
  id: number;
  donor_name: string;
  email: string;
  amount: number;
  campaign_id: number | null;
  payment_method: string;
  transaction_id: string;
  status: string;
  date: string;
  receipt_number: string;
}

export default function ContributionsView({ token, language }: { token: string; language?: Language }) {
  const t = translations[language || 'en'];
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [donorName, setDonorName] = useState('Anjali Sharma');
  const [donorEmail, setDonorEmail] = useState('anjali.sharma@gmail.com');
  const [amount, setAmount] = useState('2000');
  const [campaignId, setCampaignId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'QR Code'>('QR Code');

  // Checkout simulation states
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'payment' | 'success'>('form');
  const [donationResult, setDonationResult] = useState<DonationResponse | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/contributions/campaigns');
      setCampaigns(res.data);
      if (res.data.length > 0) {
        setCampaignId(res.data[0].id.toString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDonateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert(language === 'ta' ? 'தயவுசெய்து சரியான தொகையை உள்ளிடவும்.' : 'Please enter a valid amount.');
      return;
    }
    setCheckoutStep('payment');
  };

  const confirmDonationSimulation = async () => {
    setProcessing(true);
    try {
      const res = await axios.post('/api/contributions/donate', {
        donor_name: donorName,
        email: donorEmail,
        amount: parseFloat(amount),
        campaign_id: campaignId ? parseInt(campaignId) : null,
        payment_method: paymentMethod
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setDonationResult(res.data);
      setCheckoutStep('success');
      fetchCampaigns(); // reload raised amounts
    } catch (e) {
      console.error(e);
      alert(language === 'ta' ? 'நன்கொடை தோல்வியடைந்தது.' : 'Donation failed.');
    } finally {
      setProcessing(false);
    }
  };

  const generatePDFReceipt = () => {
    if (!donationResult) return;

    const doc = new jsPDF();

    // Receipt Header
    doc.setFillColor(22, 163, 74); // primary green
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(language === 'ta' ? 'WOMEN EMPOWERMENT TRUST (WET)' : 'WOMEN EMPOWERMENT TRUST', 15, 25);
    doc.setFontSize(10);
    doc.text(language === 'ta' ? 'Head Office: Poochinayakkanpatti, Dindigul, Tamil Nadu' : 'Head Office: Poochinayakkanpatti, Dindigul, Tamil Nadu', 15, 33);

    // Title
    doc.setTextColor(33, 41, 55);
    doc.setFontSize(18);
    doc.text(language === 'ta' ? 'OFFICIAL DONATION RECEIPT' : 'OFFICIAL DONATION RECEIPT', 15, 55);

    // Details Table Grid
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');

    const fields = [
      [language === 'ta' ? 'Receipt Number:' : 'Receipt Number:', donationResult.receipt_number],
      [language === 'ta' ? 'Date of payment:' : 'Date of payment:', donationResult.date],
      [language === 'ta' ? 'Donor Full Name:' : 'Donor Full Name:', donationResult.donor_name],
      [language === 'ta' ? 'Donor Email Address:' : 'Donor Email Address:', donationResult.email],
      [language === 'ta' ? 'Donation Amount:' : 'Donation Amount:', `INR ${donationResult.amount.toLocaleString('en-IN')}.00`],
      [language === 'ta' ? 'Payment Method:' : 'Payment Method:', donationResult.payment_method],
      [language === 'ta' ? 'Transaction ID:' : 'Transaction ID:', donationResult.transaction_id],
      [language === 'ta' ? 'Payment Status:' : 'Payment Status:', donationResult.status],
      [language === 'ta' ? 'Supported Campaign:' : 'Supported Campaign:', campaignId ? campaigns.find(c => c.id === parseInt(campaignId))?.title || 'General Fund' : 'General Fund']
    ];

    let y = 70;
    fields.forEach(([label, value]) => {
      doc.setFont('Helvetica', 'bold');
      doc.text(label, 15, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(value || 'N/A', 65, y);
      y += 10;
    });

    // Thank you section
    doc.setFillColor(240, 253, 244);
    doc.rect(15, y + 10, 180, 25, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(22, 163, 74);
    doc.text(language === 'ta' ? 'Thank you for supporting community development!' : 'Thank you for supporting community development!', 20, y + 20);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(language === 'ta' ? 'Your contribution helps us build infrastructure, train youth, and empower women.' : 'Your contribution helps us build infrastructure, train youth, and empower women.', 20, y + 27);

    // Save PDF
    doc.save(`WET_Donation_${donationResult.receipt_number}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          {t.contributionsTitle}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t.contributionsTagline}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">{language === 'ta' ? 'வாழ்வாதார பிரச்சாரங்களை ஏற்றுகிறது...' : 'Loading contribution campaigns...'}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Campaigns Progress (Right on large screens, fits 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-2">{t.activeCampaignsHeader}</h2>
            <div className="space-y-4">
              {campaigns.map(camp => {
                const percent = Math.min(100, Math.round((camp.raised_amount / camp.target_amount) * 100));
                return (
                  <div key={camp.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-subtle space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{camp.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${camp.status === 'Completed' ? 'bg-green-50 text-green-700 dark:bg-green-950/20' : 'bg-primary-50 text-primary-700 dark:bg-primary-950/20'}`}>
                        {camp.status === 'Completed' ? (language === 'ta' ? 'முடிவடைந்தது' : 'Completed') : (language === 'ta' ? 'செயலில் உள்ளது' : 'Active')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{camp.description}</p>
                    
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-500">
                        <span>{t.raised}: ₹{camp.raised_amount.toLocaleString('en-IN')}</span>
                        <span>{t.goal}: ₹{camp.target_amount.toLocaleString('en-IN')} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Donation Form Container (Left on large screens, 1 col) */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-subtle h-fit">
              {checkoutStep === 'form' && (
                <form onSubmit={handleDonateSubmit} className="space-y-4 text-sm">
                  <h2 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                    <IndianRupee className="h-5 w-5 text-primary-500" /> {t.supportInitiatives}
                  </h2>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t.donorName}</label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={e => setDonorName(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t.emailAddress}</label>
                    <input
                      type="email"
                      value={donorEmail}
                      onChange={e => setDonorEmail(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t.selectCampaign}</label>
                    <select
                      value={campaignId}
                      onChange={e => setCampaignId(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="">{language === 'ta' ? 'பொது நல நிதி' : 'General Welfare Fund'}</option>
                      {campaigns.filter(c => c.status === 'Active').map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t.contributionAmount}</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t.paymentMethod}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('QR Code')}
                        className={`py-2 px-3 border rounded text-xs font-semibold flex items-center justify-center gap-1 ${paymentMethod === 'QR Code' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <QrCode className="h-4 w-4" /> {language === 'ta' ? 'QR குறியீடு' : 'QR Code'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('UPI')}
                        className={`py-2 px-3 border rounded text-xs font-semibold flex items-center justify-center gap-1 ${paymentMethod === 'UPI' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <CreditCard className="h-4 w-4" /> {language === 'ta' ? 'UPI ஐடி' : 'UPI ID'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded text-xs transition duration-200"
                  >
                    {t.proceedDonate}
                  </button>
                </form>
              )}

              {checkoutStep === 'payment' && (
                <div className="space-y-4 text-center">
                  <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">{t.gatewayHeader}</h2>
                  <p className="text-xs text-slate-500">{t.gatewayTagline}</p>
                  
                  {/* QR SVG Simulation */}
                  <div className="h-40 w-40 border border-slate-200 dark:border-slate-800 rounded bg-white p-3 mx-auto flex flex-col justify-between items-center shadow">
                    <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100">
                      <rect x="10" y="10" width="20" height="20" fill="currentColor" />
                      <rect x="70" y="10" width="20" height="20" fill="currentColor" />
                      <rect x="10" y="70" width="20" height="20" fill="currentColor" />
                      
                      <rect x="15" y="15" width="10" height="10" fill="white" />
                      <rect x="75" y="15" width="10" height="10" fill="white" />
                      <rect x="15" y="75" width="10" height="10" fill="white" />
                      
                      <rect x="35" y="25" width="5" height="15" fill="currentColor" />
                      <rect x="45" y="15" width="15" height="5" fill="currentColor" />
                      <rect x="25" y="45" width="15" height="25" fill="currentColor" opacity="0.8" />
                      <rect x="55" y="55" width="25" height="15" fill="currentColor" />
                    </svg>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded text-xs space-y-1 font-semibold text-slate-600 dark:text-slate-400">
                    <div>{t.receiver}: Women Empowerment Trust</div>
                    <div className="text-primary-600">{t.amountPayable}: ₹{amount}.00</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setCheckoutStep('form')}
                      className="w-1/2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 rounded text-xs transition font-semibold"
                    >
                      {t.cancel}
                    </button>
                    <button
                      onClick={confirmDonationSimulation}
                      className="w-1/2 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded text-xs transition font-semibold"
                      disabled={processing}
                    >
                      {processing ? (language === 'ta' ? 'செயலாக்கப்படுகிறது...' : 'Processing...') : t.confirmSimulation}
                    </button>
                  </div>
                </div>
              )}

              {checkoutStep === 'success' && donationResult && (
                <div className="space-y-4 text-center text-sm">
                  <ShieldCheck className="h-12 w-12 text-green-600 mx-auto" />
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.confirmedHeader}</h2>
                  <p className="text-xs text-slate-500">
                    {t.confirmedTagline} <strong>{donationResult.receipt_number}</strong>
                  </p>

                  <div className="space-y-2 pt-2 border-t text-xs text-left">
                    <div><strong>{t.donorName}:</strong> {donationResult.donor_name}</div>
                    <div><strong>{t.amountPayable}:</strong> ₹{donationResult.amount.toLocaleString()}</div>
                    <div><strong>{t.transactionId}:</strong> {donationResult.transaction_id}</div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={generatePDFReceipt}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 rounded flex items-center justify-center gap-1.5"
                    >
                      <Download className="h-4 w-4" /> {t.downloadReceipt}
                    </button>
                    <button
                      onClick={() => setCheckoutStep('form')}
                      className="w-full border hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold py-2 rounded"
                    >
                      {t.backContributions}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
