const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

function initDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    console.log('JSON Database file not found. Initializing seed data...');
    const seedData = getSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf8');
  } else {
    // Ensure all tables are present
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      const keys = [
        'users', 'schemes', 'saved_schemes', 'campaigns', 'contributions',
        'help_desk_requests', 'water_issues', 'reservoirs', 'agriculture_requests',
        'training_programs', 'training_registrations', 'shg_enrollments',
        'jobs_opportunities', 'learning_resources', 'events', 'event_registrations',
        'feedback', 'stories', 'notifications', 'activity_logs'
      ];
      let modified = false;
      keys.forEach(key => {
        if (!data[key]) {
          data[key] = [];
          modified = true;
        }
      });
      if (modified) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
      }
    } catch (e) {
      console.error('Error parsing JSON db, re-initializing...');
      fs.writeFileSync(DB_FILE, JSON.stringify(getSeedData(), null, 2), 'utf8');
    }
  }
}

function getSeedData() {
  const salt = bcrypt.genSaltSync(10);
  const adminPassword = bcrypt.hashSync('1234', salt);
  const userPassword = bcrypt.hashSync('member123', salt);

  const seed = {
    users: [
      {
        id: 1,
        name: 'WET Admin',
        username: 'admin1',
        email: 'admin1@wettrust.org',
        password: adminPassword,
        role: 'Admin',
        status: 'Approved',
        age: 35,
        gender: 'Female',
        location: 'Dindigul',
        farmer_status: false,
        shg_membership: false
      },
      {
        id: 2,
        name: 'Priya Raman (Staff)',
        username: 'priya_staff',
        email: 'priya@wettrust.org',
        password: adminPassword,
        role: 'Staff',
        status: 'Approved',
        age: 28,
        gender: 'Female',
        location: 'Poochinayakkanpatti',
        farmer_status: false,
        shg_membership: true
      },
      {
        id: 3,
        name: 'Muthu Kumar (Farmer)',
        username: 'muthu_farmer',
        email: 'muthu@gmail.com',
        password: userPassword,
        role: 'Member',
        status: 'Approved',
        age: 42,
        gender: 'Male',
        occupation: 'Farming',
        income: 85000,
        education: '10th Standard',
        location: 'Poochinayakkanpatti',
        farmer_status: true,
        shg_membership: false
      },
      {
        id: 4,
        name: 'Anjali Devi',
        username: 'anjali_member',
        email: 'anjali@gmail.com',
        password: userPassword,
        role: 'Member',
        status: 'Approved',
        age: 26,
        gender: 'Female',
        occupation: 'Tailoring',
        income: 48000,
        education: '12th Standard',
        location: 'Dindigul',
        farmer_status: false,
        shg_membership: true
      }
    ],
    schemes: [
      {
        id: 1,
        name: 'Kalaignar Magalir Urimai Thogai',
        description: 'A monthly basic income scheme for women heads of families in Tamil Nadu, aiming to improve livelihood and security.',
        category: 'Women Empowerment',
        benefits: 'Direct benefit transfer of ₹1,000 per month directly to the bank account.',
        eligibility_criteria: 'Gender: Female, Minimum Age: 21, Maximum Family Income: 250000, Exclusion: Government employees, taxpayers.',
        required_documents: 'Aadhaar Card, Ration Card (Smart Card), Income Certificate, Bank Passbook details.',
        application_process: 'Apply online through designated registration camps at local ration shops or online portal.',
        official_url: 'https://kmut.tn.gov.in/',
        last_updated_date: '2026-05-10'
      },
      {
        id: 2,
        name: 'Beti Bachao Beti Padhao',
        description: 'A national campaign aimed at addressing declining child sex ratio and promoting education and empowerment of girl children.',
        category: 'Women Empowerment',
        benefits: 'Financial incentives, educational support, and safety programs for girls.',
        eligibility_criteria: 'Gender: Female, Age: 0 to 18, Targets families with girl children.',
        required_documents: 'Birth Certificate of girl child, Parent Identity Proof (Aadhaar, Ration Card).',
        application_process: 'Contact local Anganwadi center or block level offices.',
        official_url: 'https://wcd.nic.in/schemes/beti-bachao-beti-padhao-em-girls',
        last_updated_date: '2026-04-15'
      },
      {
        id: 3,
        name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
        description: 'Income support scheme for all landholding farmer families across the country to meet domestic needs.',
        category: 'Agriculture',
        benefits: '₹6,000 per year paid in three equal installments of ₹2,000 directly into bank accounts.',
        eligibility_criteria: 'Farmer Status: True, Landholding family, Excluding institutional landowners.',
        required_documents: 'Land Ownership Documents (Patta Chitta), Aadhaar Card, Bank Account Details.',
        application_process: 'Self-registration through PM-Kisan Portal or local Common Service Centers (CSC).',
        official_url: 'https://pmkisan.gov.in/',
        last_updated_date: '2026-06-01'
      },
      {
        id: 4,
        name: 'PM Fasal Bima Yojana',
        description: 'Crop insurance scheme offering financial support to farmers suffering crop loss/damage due to natural calamities.',
        category: 'Agriculture',
        benefits: 'Low premium crop insurance coverage with full settlement of claims for loss.',
        eligibility_criteria: 'Farmer Status: True, All farmers growing notified crops in notified areas.',
        required_documents: 'Land record copy, Crop sowing certificate, Bank account passbook, Aadhaar card.',
        application_process: 'Apply through banks, insurance intermediaries, or PMFBY portal.',
        official_url: 'https://pmfby.gov.in/',
        last_updated_date: '2026-05-20'
      },
      {
        id: 5,
        name: 'Soil Health Card Scheme',
        description: 'Promoting soil test based nutrient management by issuing Soil Health Cards with crop-wise nutrient recommendations.',
        category: 'Agriculture',
        benefits: 'Free soil testing and customized recommendations for fertilizers to increase yield.',
        eligibility_criteria: 'Farmer Status: True, All landholding farmers.',
        required_documents: 'Soil sample information sheet, land Patta details, Aadhaar card.',
        application_process: 'Submit soil samples at local agriculture department lab or soil testing unit.',
        official_url: 'https://soilhealth.dac.gov.in/',
        last_updated_date: '2026-03-10'
      },
      {
        id: 6,
        name: 'Kisan Credit Card (KCC)',
        description: 'Providing farmers with timely and flexible credit support for agricultural expenses.',
        category: 'Agriculture',
        benefits: 'Subsidized loan interest rates (up to 4%), flexible repayment options, crop insurance cover.',
        eligibility_criteria: 'Farmer Status: True, Owner cultivators, tenant farmers, sharecroppers.',
        required_documents: 'Patta/Land documents, Crop cultivation proof, Aadhaar Card, PAN Card.',
        application_process: 'Submit application to nearest commercial bank, regional rural bank, or cooperative bank.',
        official_url: 'https://www.india.gov.in/spotlight/kisan-credit-card-scheme',
        last_updated_date: '2026-05-18'
      },
      {
        id: 7,
        name: 'Skill India Mission',
        description: 'A national campaign to empower youth with skill training to improve employment and entrepreneurship.',
        category: 'Skill Development',
        benefits: 'Free vocational training, certification, placements, and toolkit support.',
        eligibility_criteria: 'Age: 15 to 45, Education: 8th Standard or above.',
        required_documents: 'Aadhaar Card, Mark sheets, Bank Account details.',
        application_process: 'Register on NSDC portal and select training partners.',
        official_url: 'https://www.skillindia.gov.in/',
        last_updated_date: '2026-01-20'
      },
      {
        id: 8,
        name: 'PMKVY (Pradhan Mantri Kaushal Vikas Yojana)',
        description: 'Flagship skill certification scheme enabling Indian youth to take up industry-relevant skill training.',
        category: 'Skill Development',
        benefits: 'Free course training, assessments, government certificates, and financial assistance.',
        eligibility_criteria: 'Age: 15 to 35, Unemployed youth or school/college dropouts.',
        required_documents: 'Aadhaar Card, Education certificates, Bank account details.',
        application_process: 'Apply via PMKVY portal and choose certified training centers.',
        official_url: 'https://www.pmkvyofficial.org/',
        last_updated_date: '2026-02-28'
      },
      {
        id: 9,
        name: 'National Apprenticeship Promotion Scheme (NAPS)',
        description: 'Promoting apprenticeship training and sharing cost of stipend with employers.',
        category: 'Skill Development',
        benefits: 'Earn while you learn. Financial support of up to ₹1,500/month shared by Government.',
        eligibility_criteria: 'Age: 14 or above, ITI pass, Diploma, Graduates, or School passouts.',
        required_documents: 'Identity card, educational certificates, bank account details.',
        application_process: 'Register on Apprenticeship India portal and apply for apprenticeship postings.',
        official_url: 'https://www.apprenticeshipindia.gov.in/',
        last_updated_date: '2026-05-15'
      },
      {
        id: 10,
        name: 'National Career Service (NCS)',
        description: 'A digital portal connecting job seekers with employers, offering counseling, and skill courses.',
        category: 'Employment',
        benefits: 'Free job search, employment registration, counseling, vocational guidance, local job fair alerts.',
        eligibility_criteria: 'Age: 14 or above, Open to job seekers, students, and professionals.',
        required_documents: 'Aadhaar Card/PAN, Educational certificates, Resume/Details.',
        application_process: 'Register online on the NCS portal.',
        official_url: 'https://www.ncs.gov.in/',
        last_updated_date: '2026-06-05'
      },
      {
        id: 11,
        name: 'National Scholarship Portal (NSP)',
        description: 'Single digital platform for various scholarships offered by Central, State, and UT governments.',
        category: 'Education',
        benefits: 'Direct scholarship amounts paid to students to support higher education expenses.',
        eligibility_criteria: 'Education: School students or College/University students, Family Income: Less than 250000 (differs by scheme).',
        required_documents: 'Income certificate, caste certificate, marksheet, bank account details.',
        application_process: 'Register on NSP portal and fill details for matching scholarship schemes.',
        official_url: 'https://scholarships.gov.in/',
        last_updated_date: '2026-05-01'
      },
      {
        id: 12,
        name: 'Jal Jeevan Mission',
        description: 'Enabling rural household access to safe and adequate drinking water through individual tap connections by 2024.',
        category: 'Water Resources',
        benefits: 'Functional Household Tap Connection (FHTC) providing safe drinking water, local water testing kits.',
        eligibility_criteria: 'All rural households and schools/community spaces in villages.',
        required_documents: 'Proof of address (Ration card/Aadhaar), Property tax receipt (if applicable).',
        application_process: 'Liaise with local Panchayat or Village Water and Sanitation Committee (VWSC).',
        official_url: 'https://jaljeevanmission.gov.in/',
        last_updated_date: '2026-04-10'
      },
      {
        id: 13,
        name: 'Atal Bhujal Yojana',
        description: 'Sustainable groundwater management scheme involving community participation and demand-side management.',
        category: 'Water Resources',
        benefits: 'Community training, water security plan development, groundwater recharge facilities, support for drip irrigation.',
        eligibility_criteria: 'Community members, farmers in water-stressed districts.',
        required_documents: 'No individual documents; registration for community training requires ID.',
        application_process: 'Register with local water user association or Panchayat.',
        official_url: 'https://ataljal.mowr.gov.in/',
        last_updated_date: '2026-03-22'
      },
      {
        id: 14,
        name: 'DAY-NRLM (Deendayal Antyodaya Yojana - National Rural Livelihoods Mission)',
        description: 'Promoting self-employment and organizing rural poor women into Self Help Groups (SHGs).',
        category: 'SHG Programs',
        benefits: 'Revolving fund, community investment fund, interest subvention on loans, bank linkage support.',
        eligibility_criteria: 'Gender: Female, Rural household, SHG member.',
        required_documents: 'Aadhaar Card, Ration Card, Bank Passbook, SHG registration book.',
        application_process: 'Form an SHG and register with the local Block Development Office.',
        official_url: 'https://aajeevika.gov.in/',
        last_updated_date: '2026-05-02'
      },
      {
        id: 15,
        name: 'PM Vishwakarma',
        description: 'Support for traditional artisans and craftspeople with skill upgrading, toolkits, and collateral-free credit.',
        category: 'Entrepreneurship',
        benefits: 'Toolkit incentive of ₹15,000, credit support up to ₹3,00,000 at 5% interest, ₹500/day training stipend.',
        eligibility_criteria: 'Artisans working in 18 trades (carpenters, blacksmiths, potters, weavers, etc.), Age: 18 or above.',
        required_documents: 'Aadhaar Card, Mobile, Bank Passbook, Trade Certificate/Self-declaration.',
        application_process: 'Apply online through Common Service Centres (CSC).',
        official_url: 'https://pmvishwakarma.gov.in/',
        last_updated_date: '2026-06-12'
      },
      {
        id: 16,
        name: 'PMEGP (Prime Minister Employment Generation Programme)',
        description: 'Credit linked subsidy scheme for setting up new micro-enterprises in manufacturing or service sectors.',
        category: 'Entrepreneurship',
        benefits: 'Subsidy up to 35% of project cost, bank loans for remaining project cost.',
        eligibility_criteria: 'Age: 18 or above, Minimum 8th Pass for projects above ₹10 Lakhs (manufacturing) or ₹5 Lakhs (service).',
        required_documents: 'Project Report/Business Plan, Educational certificate, Caste certificate (if applicable), Aadhaar card.',
        application_process: 'Apply online on KVIC portal with project report and selected bank.',
        official_url: 'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp',
        last_updated_date: '2026-05-25'
      }
    ],
    saved_schemes: [],
    campaigns: [
      {
        id: 1,
        title: 'Water Purification For Poochinayakkanpatti',
        description: 'Installing standard reverse-osmosis (RO) filtration systems to supply clean water to 300 households.',
        target_amount: 150000,
        raised_amount: 85000,
        status: 'Active',
        created_at: '2026-06-01T10:00:00.000Z'
      },
      {
        id: 2,
        title: 'Women Tailoring Toolkit Fund',
        description: 'Procuring heavy-duty sewing machines and starter fabrics for 20 women in our tailoring batch.',
        target_amount: 80000,
        raised_amount: 80000,
        status: 'Completed',
        created_at: '2026-05-15T11:00:00.000Z'
      }
    ],
    contributions: [
      {
        id: 1,
        donor_name: 'Rajesh Nair',
        email: 'rajesh.nair@gmail.com',
        amount: 5000,
        campaign_id: 1,
        payment_method: 'UPI',
        transaction_id: 'UPI123456789012',
        status: 'Success',
        date: '2026-06-05',
        receipt_number: 'WET-2026-001'
      },
      {
        id: 2,
        donor_name: 'Sudha Chandran',
        email: 'sudha@hotmail.com',
        amount: 10000,
        campaign_id: 1,
        payment_method: 'QR Code',
        transaction_id: 'TXN9876543210',
        status: 'Success',
        date: '2026-06-10',
        receipt_number: 'WET-2026-002'
      }
    ],
    help_desk_requests: [
      {
        id: 1,
        user_id: 3,
        category: 'Agriculture Assistance',
        subject: 'Soil Quality Diagnostic Support',
        description: 'I need assistance testing my farm soil and understanding which fertilizers are recommended under the Soil Health Card Scheme.',
        attachment_url: '',
        status: 'Pending',
        created_at: '2026-06-13T10:00:00.000Z'
      },
      {
        id: 2,
        user_id: 4,
        category: 'SHG Support',
        subject: 'DAY-NRLM Loan Disbursement Delay',
        description: 'Our SHG (Dindigul Magalir Sangam) applied for the bank linkage subsidy last month. Need advice on status check.',
        attachment_url: '',
        status: 'In Progress',
        created_at: '2026-06-14T09:30:00.000Z'
      }
    ],
    water_issues: [
      {
        id: 1,
        user_id: 3,
        issue_type: 'Pipe Leakage',
        location: 'Middle Street, Poochinayakkanpatti',
        description: 'Water has been leaking from the main supply pipeline near the community tap for the last two days, flooding the street.',
        image_url: '',
        status: 'Reported',
        created_at: '2026-06-14T08:00:00.000Z'
      }
    ],
    reservoirs: [
      {
        id: 1,
        name: 'Poochinayakkanpatti Tank',
        location: 'Poochinayakkanpatti',
        capacity: '50,000 Liters',
        current_level: '38,500 Liters',
        last_updated: '2026-06-15T18:00:00.000Z'
      },
      {
        id: 2,
        name: 'Palani Road Community Reservoir',
        location: 'Dindigul Outskirts',
        capacity: '120,000 Liters',
        current_level: '92,000 Liters',
        last_updated: '2026-06-15T17:30:00.000Z'
      }
    ],
    agriculture_requests: [
      {
        id: 1,
        user_id: 3,
        request_type: 'Field Visit',
        description: 'Requesting a field visit from WET agriculturist to inspect pest infestation in our groundnut crop.',
        status: 'Pending',
        created_at: '2026-06-15T09:00:00.000Z'
      }
    ],
    training_programs: [
      {
        id: 1,
        title: 'Advanced Organic Farming & Soil Care',
        description: 'Practical training on bio-fertilizers, vermicomposting, and reading soil card charts.',
        category: 'Agriculture Workshop',
        instructor: 'Dr. S. Ramasamy (TNAU)',
        date: '2026-06-25',
        location: 'WET Head Office, Poochinayakkanpatti',
        capacity: 30,
        registered_count: 5
      },
      {
        id: 2,
        title: 'Tailoring & Garment Making Starter Course',
        description: 'A 3-month course with specialized business training for traditional trades.',
        category: 'Women Development',
        instructor: 'Mrs. K. Meenakshi',
        date: '2026-07-01',
        location: 'WET Community Hall, Dindigul',
        capacity: 20,
        registered_count: 12
      }
    ],
    training_registrations: [
      {
        id: 1,
        user_id: 3,
        program_id: 1,
        registered_at: '2026-06-15T10:00:00.000Z',
        status: 'Approved'
      },
      {
        id: 2,
        user_id: 4,
        program_id: 2,
        registered_at: '2026-06-15T11:00:00.000Z',
        status: 'Approved'
      }
    ],
    shg_enrollments: [
      {
        id: 1,
        user_id: 4,
        shg_name: 'Dindigul Magalir Sangam',
        role: 'Treasurer',
        enrollment_date: '2026-05-10',
        status: 'Approved'
      }
    ],
    jobs_opportunities: [
      {
        id: 1,
        title: 'Apprentice Tailoring Assistant',
        type: 'Internship',
        organization: 'WET Livelihood Center',
        location: 'Poochinayakkanpatti',
        description: 'Assist in tailoring operations, sewing orders, and managing fabric inventory.',
        requirements: 'Basic knowledge of sewing machines, tailoring certificate preferred.',
        benefits: 'Stipend of ₹4,500/month, certificate of internship, option for full-time role.',
        application_url: 'https://wettrust.org/careers',
        deadline: '2026-06-30'
      },
      {
        id: 2,
        title: 'Community Water Monitor',
        type: 'Volunteer',
        organization: 'Jal Jeevan Local Council',
        location: 'Dindigul Villages',
        description: 'Monitor water supply schedules, test water purity using WET kits, and report supply pipe leaks.',
        requirements: 'Basic literacy, willingness to travel locally, interest in water safety.',
        benefits: 'Travel allowance, free water testing kits, volunteer experience letter.',
        application_url: 'https://wettrust.org/volunteers',
        deadline: '2026-07-15'
      }
    ],
    learning_resources: [
      {
        id: 1,
        title: 'Introduction to Drip Irrigation and Water Conservation',
        category: 'Water Conservation',
        content_type: 'Guide',
        content_body: 'Drip irrigation is an efficient method of watering crops that saves water and fertilizer. In this guide, we discuss: 1) System components: filters, regulators, piping, emitters; 2) Installation guides for clay and sandy soils; 3) Scheduling watering schedules based on ground moisture; 4) Subsidy details under PMKSY.',
        url: ''
      },
      {
        id: 2,
        title: 'Financial Literacy: How to Open a bank Account & Apply for SHG Loans',
        category: 'Financial Literacy',
        content_type: 'Document',
        content_body: 'A comprehensive starter manual explaining banking basics: 1) Zero-balance savings accounts; 2) Microfinance loans via DAY-NRLM; 3) What is interest subvention and how to calculate repayments; 4) Security measures for UPI pin and mobile banking.',
        url: ''
      }
    ],
    events: [
      {
        id: 1,
        title: 'Community Water Conservation Drive',
        description: 'Participatory campaign to build rain-water harvesting recharge wells and clean the village tank before monsoon.',
        category: 'Water Conservation Drive',
        event_date: '2026-06-22',
        location: 'Main Tank, Poochinayakkanpatti',
        organizer: 'Women Empowerment Trust'
      },
      {
        id: 2,
        title: 'Empowerment Workshop: PM Vishwakarma Scheme Benefits',
        description: 'Detailed guidance session by district officials to register artisans for PM Vishwakarma toolkits and grants.',
        category: 'Awareness Campaign',
        event_date: '2026-06-28',
        location: 'Poochinayakkanpatti School Ground',
        organizer: 'WET Staff & Lead Bank'
      }
    ],
    event_registrations: [
      {
        id: 1,
        user_id: 3,
        event_id: 1,
        registered_at: '2026-06-15T12:00:00.000Z'
      }
    ],
    feedback: [
      {
        id: 1,
        user_id: 3,
        type: 'General Feedback',
        content: 'The government scheme finder is exceptionally helpful. I was able to verify PM-KISAN Patta rules in five minutes!',
        rating: 5,
        created_at: '2026-06-15T15:00:00.000Z'
      }
    ],
    stories: [
      {
        id: 1,
        title: 'Tailoring Program Opened Doors to Financial Independence',
        category: 'Women',
        content: 'Anjali Devi, a resident of Poochinayakkanpatti, completed the tailoring training program under the Women Empowerment Center. With financial support from the WET Toolkit donation campaign, she bought a heavy-duty sewing machine. Today, she runs a successful home tailoring boutique earning over ₹8,000 per month, supporting her children\'s schooling.',
        image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop',
        video_url: '',
        beneficiary_name: 'Anjali Devi'
      }
    ],
    notifications: [
      {
        id: 1,
        user_id: 3,
        title: 'Scheme Last Date Alert',
        message: 'The deadline for PM-KISAN annual renewal is fast approaching. Update Patta land details before 30th June.',
        type: 'Scheme',
        is_read: false,
        created_at: '2026-06-15T10:00:00.000Z'
      }
    ],
    activity_logs: [
      {
        id: 1,
        user_id: 1,
        action: 'DB_INITIALIZATION',
        table_affected: 'system',
        record_id: 0,
        timestamp: '2026-06-15T19:26:00.000Z'
      }
    ]
  };

  return seed;
}

// Low-level read/write
function readData() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error('Error reading JSON DB file:', e);
    return getSeedData();
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing JSON DB file:', e);
    return false;
  }
}

const dbJson = {
  getAll: (table) => {
    const data = readData();
    return data[table] || [];
  },

  getById: (table, id) => {
    const data = readData();
    return (data[table] || []).find(item => item.id === parseInt(id));
  },

  create: (table, item) => {
    const data = readData();
    if (!data[table]) data[table] = [];
    
    const nextId = data[table].reduce((max, i) => i.id > max ? i.id : max, 0) + 1;
    const newItem = { id: nextId, ...item };
    data[table].push(newItem);
    
    writeData(data);
    return newItem;
  },

  update: (table, id, updates) => {
    const data = readData();
    if (!data[table]) return null;
    
    const index = data[table].findIndex(item => item.id === parseInt(id));
    if (index === -1) return null;
    
    const updatedItem = { ...data[table][index], ...updates, id: parseInt(id) };
    data[table][index] = updatedItem;
    
    writeData(data);
    return updatedItem;
  },

  delete: (table, id) => {
    const data = readData();
    if (!data[table]) return false;
    
    const index = data[table].findIndex(item => item.id === parseInt(id));
    if (index === -1) return false;
    
    data[table].splice(index, 1);
    writeData(data);
    return true;
  },

  query: (table, filterFn) => {
    const data = readData();
    return (data[table] || []).filter(filterFn);
  }
};

initDb();

module.exports = dbJson;
