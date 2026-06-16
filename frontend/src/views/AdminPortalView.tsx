import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Settings, Plus, Edit2, Trash2, Users, FileText, Download, ShieldCheck, Clipboard } from 'lucide-react';
import { translations, Language } from '../translations';

interface Scheme {
  id: number;
  name: string;
  category: string;
  description: string;
  benefits: string;
  eligibility_criteria: string;
  required_documents: string;
  application_process: string;
  official_url: string;
  last_updated_date: string;
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'Admin' | 'Staff' | 'Member';
  status: 'Approved' | 'Pending';
  location?: string;
}

interface AuditLog {
  id: number;
  userName: string;
  action: string;
  table_affected: string;
  record_id: number;
  timestamp: string;
}

export default function AdminPortalView({ token, language }: { token: string; language?: Language }) {
  const t = translations[language || 'en'];
  const [activeTab, setActiveTab] = useState<'schemes' | 'users' | 'logs' | 'reports'>('schemes');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Scheme Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
  
  // Scheme form inputs
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Women Empowerment');
  const [description, setDescription] = useState('');
  const [benefits, setBenefits] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [documents, setDocuments] = useState('');
  const [processSteps, setProcessSteps] = useState('');
  const [officialUrl, setOfficialUrl] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'schemes') {
        const res = await axios.get('/api/schemes');
        setSchemes(res.data);
      } else if (activeTab === 'users') {
        const res = await axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } });
        setUsers(res.data);
      } else if (activeTab === 'logs') {
        const res = await axios.get('/api/audit-logs', { headers: { Authorization: `Bearer ${token}` } });
        setLogs(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingScheme(null);
    setName('');
    setCategory('Women Empowerment');
    setDescription('');
    setBenefits('');
    setEligibility('');
    setDocuments('');
    setProcessSteps('');
    setOfficialUrl('');
    setShowModal(true);
  };

  const handleOpenEdit = (s: Scheme) => {
    setEditingScheme(s);
    setName(s.name);
    setCategory(s.category);
    setDescription(s.description);
    setBenefits(s.benefits);
    setEligibility(s.eligibility_criteria);
    setDocuments(s.required_documents);
    setProcessSteps(s.application_process);
    setOfficialUrl(s.official_url);
    setShowModal(true);
  };

  const getCategoryLabel = (cat: string) => {
    if (language === 'ta') {
      switch (cat) {
        case 'Women Empowerment': return 'பெண்கள் மேம்பாடு';
        case 'Agriculture': return 'விவசாயம்';
        case 'Education': return 'கல்வி';
        case 'Scholarships': return 'உதவித்தொகை';
        case 'Employment': return 'வேலைவாய்ப்பு';
        case 'Skill Development': return 'திறன் மேம்பாடு';
        case 'Entrepreneurship': return 'தொழில்முனைவு';
        case 'Health & Welfare': return 'சுகாதாரம் & நலம்';
        case 'Water Resources': return 'நீர் ஆதாரங்கள்';
        case 'Rural Development': return 'ஊரக வளர்ச்சி';
        case 'SHG Programs': return 'சுய உதவிக்குழு திட்டங்கள்';
        default: return cat;
      }
    }
    return cat;
  };

  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      category,
      description,
      benefits,
      eligibility_criteria: eligibility,
      required_documents: documents,
      application_process: processSteps,
      official_url: officialUrl
    };

    try {
      if (editingScheme) {
        await axios.put(`/api/schemes/${editingScheme.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert(language === 'ta' ? 'திட்டம் வெற்றிகரமாகப் புதுப்பிக்கப்பட்டது.' : 'Scheme updated successfully.');
      } else {
        await axios.post('/api/schemes', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert(language === 'ta' ? 'திட்டம் வெற்றிகரமாகச் சேர்க்கப்பட்டது.' : 'Scheme added successfully.');
      }
      setShowModal(false);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert(language === 'ta' ? 'சேமிப்பது தோல்வியடைந்தது.' : 'Save failed.');
    }
  };

  const handleDeleteScheme = async (id: number) => {
    if (!window.confirm(t.deleteScheme)) return;
    try {
      await axios.delete(`/api/schemes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(language === 'ta' ? 'திட்டம் நீக்கப்பட்டது.' : 'Scheme deleted.');
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUserRoleChange = async (id: number, role: 'Admin' | 'Staff' | 'Member') => {
    try {
      await axios.put(`/api/users/${id}/role`, { role }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(language === 'ta' ? 'பயனர் பொறுப்பு புதுப்பிக்கப்பட்டது!' : 'User role updated!');
      fetchAdminData();
    } catch (e: any) {
      alert(e.response?.data?.error || (language === 'ta' ? 'பொறுப்பு மாற்றம் தோல்வியடைந்தது.' : 'Role change failed.'));
    }
  };

  const handleUserStatusChange = async (id: number, status: 'Approved' | 'Pending') => {
    try {
      await axios.put(`/api/users/${id}/role`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(language === 'ta' ? 'பயனர் கணக்கு நிலை புதுப்பிக்கப்பட்டது!' : 'User account status updated!');
      fetchAdminData();
    } catch (e: any) {
      alert(e.response?.data?.error || (language === 'ta' ? 'கணக்கு நிலை மாற்றம் தோல்வியடைந்தது.' : 'Status change failed.'));
    }
  };

  // Export PDF Report (Tabular layout)
  const exportPDFReport = async () => {
    try {
      const schemesRes = await axios.get('/api/schemes');
      const usersRes = await axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      const contributionsRes = await axios.get('/api/contributions/campaigns');
      
      const doc = new jsPDF();
      
      // Title
      doc.setFillColor(22, 163, 74);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('WET360 Platform Audit Report Summary', 15, 20);
      
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(12);
      doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 15, 42);

      // Section 1: Schemes
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text('Active Welfare Schemes Listed', 15, 52);
      
      const schemeRows = schemesRes.data.map((s: Scheme) => [s.id, s.name, s.category, s.last_updated_date]);
      (doc as any).autoTable({
        startY: 57,
        head: [['ID', 'Scheme Name', 'Category', 'Updated Date']],
        body: schemeRows,
        theme: 'striped',
        styles: { fontSize: 8 }
      });

      // Section 2: Users
      const lastY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text('Registered Community Users', 15, lastY);
      
      const userRows = usersRes.data.map((u: User) => [u.id, u.name, u.email, u.role, u.status]);
      (doc as any).autoTable({
        startY: lastY + 5,
        head: [['ID', 'Name', 'Email Address', 'System Role', 'Status']],
        body: userRows,
        theme: 'grid',
        styles: { fontSize: 8 }
      });

      doc.save(`WET360_System_Audit_Report.pdf`);
    } catch (err) {
      console.error(err);
      alert(language === 'ta' ? 'PDF உருவாக்கம் தோல்வியடைந்தது.' : 'PDF generation failed.');
    }
  };

  // Export Excel Report (Multi-sheet spreadsheet)
  const exportExcelReport = async () => {
    try {
      const [schemesRes, usersRes, contributionsRes] = await Promise.all([
        axios.get('/api/schemes'),
        axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/contributions/campaigns')
      ]);

      const wb = XLSX.utils.book_new();

      // Sheet 1: Schemes
      const wsSchemes = XLSX.utils.json_to_sheet(schemesRes.data.map((s: Scheme) => ({
        ID: s.id,
        Name: s.name,
        Category: s.category,
        Benefits: s.benefits,
        Eligibility: s.eligibility_criteria,
        URL: s.official_url
      })));
      XLSX.utils.book_append_sheet(wb, wsSchemes, 'Welfare Schemes');

      // Sheet 2: Users
      const wsUsers = XLSX.utils.json_to_sheet(usersRes.data.map((u: User) => ({
        ID: u.id,
        Name: u.name,
        Username: u.username,
        Email: u.email,
        Role: u.role,
        Status: u.status,
        Location: u.location || ''
      })));
      XLSX.utils.book_append_sheet(wb, wsUsers, 'System Accounts');

      // Sheet 3: Campaigns
      const wsCampaigns = XLSX.utils.json_to_sheet(contributionsRes.data);
      XLSX.utils.book_append_sheet(wb, wsCampaigns, 'Funding Campaigns');

      XLSX.writeFile(wb, 'WET360_Consolidated_Impact_Metrics.xlsx');
    } catch (err) {
      console.error(err);
      alert(language === 'ta' ? 'Excel ஏற்றுமதி தோல்வியடைந்தது.' : 'Excel export failed.');
    }
  };

  const categories = [
    'Women Empowerment',
    'Agriculture',
    'Education',
    'Scholarships',
    'Employment',
    'Skill Development',
    'Entrepreneurship',
    'Health & Welfare',
    'Water Resources',
    'Rural Development',
    'SHG Programs'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary-500" />
            {t.adminTitle}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.adminTagline}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-1 ${activeTab === 'schemes' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Settings className="h-3.5 w-3.5" /> {t.schemesEditor}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-1 ${activeTab === 'users' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Users className="h-3.5 w-3.5" /> {t.usersList}
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-1 ${activeTab === 'logs' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Clipboard className="h-3.5 w-3.5" /> {t.auditTrail}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-1 ${activeTab === 'reports' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <FileText className="h-3.5 w-3.5" /> {t.dataExports}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">
          {language === 'ta' ? 'நிர்வாக தரவுகளை ஏற்றுகிறது...' : 'Loading admin ledger data...'}
        </div>
      ) : (
        <>
          {activeTab === 'schemes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">{t.schemesDb}</h2>
                <button
                  onClick={handleOpenAdd}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-1.5 px-4 rounded text-xs transition duration-200 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> {t.addScheme}
                </button>
              </div>

              {/* Data Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-subtle">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                        <th className="p-3">{language === 'ta' ? 'ஐடி' : 'ID'}</th>
                        <th className="p-3">{language === 'ta' ? 'திட்டத்தின் பெயர்' : 'Scheme Name'}</th>
                        <th className="p-3">{language === 'ta' ? 'பிரிவு' : 'Category'}</th>
                        <th className="p-3">{language === 'ta' ? 'கடைசியாக புதுப்பிக்கப்பட்டது' : 'Last Updated'}</th>
                        <th className="p-3 text-right">{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {schemes.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-700 dark:text-slate-300">
                          <td className="p-3 font-semibold">#{s.id}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{s.name}</td>
                          <td className="p-3">{getCategoryLabel(s.category)}</td>
                          <td className="p-3 text-slate-400">{s.last_updated_date}</td>
                          <td className="p-3 text-right space-x-1.5">
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 p-1.5 rounded"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteScheme(s.id)}
                              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">{t.approveUsers}</h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-subtle">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                        <th className="p-3">{language === 'ta' ? 'ஐடி' : 'ID'}</th>
                        <th className="p-3">{language === 'ta' ? 'பெயர்' : 'Name'}</th>
                        <th className="p-3">{language === 'ta' ? 'மின்னஞ்சல்' : 'Email'}</th>
                        <th className="p-3">{t.authorizedRole}</th>
                        <th className="p-3">{t.accountStatus}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-700 dark:text-slate-300">
                          <td className="p-3">#{u.id}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                          <td className="p-3">{u.email}</td>
                          <td className="p-3">
                            <select
                              value={u.role}
                              onChange={e => handleUserRoleChange(u.id, e.target.value as any)}
                              className="bg-transparent border border-slate-200 dark:border-slate-800 rounded p-1 text-xs dark:bg-slate-900"
                            >
                              <option value="Member">{language === 'ta' ? 'உறுப்பினர்' : 'Member'}</option>
                              <option value="Staff">{language === 'ta' ? 'ஊழியர்' : 'Staff'}</option>
                              <option value="Admin">{language === 'ta' ? 'நிர்வாகி' : 'Admin'}</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <select
                              value={u.status}
                              onChange={e => handleUserStatusChange(u.id, e.target.value as any)}
                              className={`rounded p-1 text-xs border font-semibold ${u.status === 'Approved' ? 'border-green-300 text-green-700 bg-green-50 dark:bg-green-950/20' : 'border-yellow-300 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20'}`}
                            >
                              <option value="Approved">{language === 'ta' ? 'அங்கீகரிக்கப்பட்டது' : 'Approved'}</option>
                              <option value="Pending">{language === 'ta' ? 'நிலுவையில் உள்ளது' : 'Pending'}</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <h2 className="text-md font-bold text-slate-800 dark:text-slate-100">{t.auditTrailHeader}</h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-subtle">
                <div className="overflow-x-auto" style={{ maxHeight: '450px' }}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold sticky top-0">
                        <th className="p-3 bg-slate-50 dark:bg-slate-950">{t.timestamp}</th>
                        <th className="p-3 bg-slate-50 dark:bg-slate-950">{t.adminUser}</th>
                        <th className="p-3 bg-slate-50 dark:bg-slate-950">{t.actionLogged}</th>
                        <th className="p-3 bg-slate-50 dark:bg-slate-950">{t.tableAffected}</th>
                        <th className="p-3 bg-slate-50 dark:bg-slate-950">{t.recordId}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-400">
                          <td className="p-3">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">{log.userName}</td>
                          <td className="p-3 font-mono">{log.action}</td>
                          <td className="p-3">{log.table_affected}</td>
                          <td className="p-3">#{log.record_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6 max-w-xl mx-auto text-center py-6">
              <FileText className="h-14 w-14 text-primary-500 mx-auto" />
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.exportReports}</h2>
                <p className="text-sm text-slate-500">
                  {language === 'ta' 
                    ? 'தரவுத்தள கோப்புகளை கட்டமைக்கப்பட்ட PDF அறிக்கைகளாக அல்லது விரிதாள்களாக பதிவிறக்கவும்.' 
                    : 'Download database files as structured PDF dossiers or spreadsheets with multiple sheets for archiving.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  onClick={exportPDFReport}
                  className="p-6 border border-slate-200 dark:border-slate-800 hover:border-primary-500 bg-white dark:bg-slate-900 rounded-lg shadow-subtle flex flex-col items-center gap-2 group transition"
                >
                  <Download className="h-8 w-8 text-primary-500 group-hover:scale-110 transition" />
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t.exportDossier}</span>
                  <span className="text-[10px] text-slate-400">
                    {language === 'ta' ? 'செயலில் உள்ள திட்டங்கள் & கணக்குகள்' : 'Active Schemes & Accounts'}
                  </span>
                </button>
                <button
                  onClick={exportExcelReport}
                  className="p-6 border border-slate-200 dark:border-slate-800 hover:border-primary-500 bg-white dark:bg-slate-900 rounded-lg shadow-subtle flex flex-col items-center gap-2 group transition"
                >
                  <Download className="h-8 w-8 text-primary-500 group-hover:scale-110 transition" />
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t.exportWorkbook}</span>
                  <span className="text-[10px] text-slate-400">
                    {language === 'ta' ? 'பல தாள்கள் கொண்ட தரவுத்தொகுப்பு' : 'Multi-sheet dataset'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Scheme Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-4 text-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {editingScheme ? t.editScheme : (language === 'ta' ? 'புதிய அரசு திட்டத்தைச் சேர்' : 'Add New Government Scheme')}
            </h2>
            <form onSubmit={handleSaveScheme} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {language === 'ta' ? 'திட்டத்தின் பெயர் *' : 'Scheme Name *'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border p-2 rounded bg-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {language === 'ta' ? 'பிரிவு *' : 'Category *'}
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full border p-2 rounded bg-transparent dark:bg-slate-900"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {language === 'ta' ? 'திட்டத்தின் விளக்கம் *' : 'Scheme Description *'}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full border p-2 rounded bg-transparent"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {language === 'ta' ? 'வழங்கப்படும் பலன்கள் *' : 'Benefits Offered *'}
                </label>
                <input
                  type="text"
                  value={benefits}
                  onChange={e => setBenefits(e.target.value)}
                  className="w-full border p-2 rounded bg-transparent"
                  placeholder="e.g. ₹1,000 per month direct transfer"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {language === 'ta' ? 'தகுதி வரம்புகள் *' : 'Eligibility Criteria Rules *'}
                </label>
                <input
                  type="text"
                  value={eligibility}
                  onChange={e => setEligibility(e.target.value)}
                  className="w-full border p-2 rounded bg-transparent"
                  placeholder="e.g. Gender: Female, Age: 21 to 60"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {language === 'ta' ? 'அதிகாரப்பூர்வ அரசு இணையதள முகவரி (URL) *' : 'Official Government Portal URL *'}
                </label>
                <input
                  type="url"
                  value={officialUrl}
                  onChange={e => setOfficialUrl(e.target.value)}
                  className="w-full border p-2 rounded bg-transparent"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded font-semibold text-xs text-slate-700 dark:text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-semibold text-xs"
                >
                  {language === 'ta' ? 'திட்ட விவரங்களைச் சேமி' : 'Save Scheme Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
