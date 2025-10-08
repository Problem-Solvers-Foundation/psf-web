/**
 * SCRIPT PARA POPULAR O BANCO DE DADOS COM PROJETOS DE EXEMPLO
 * Execute: node seed-projects.js
 */

const { db } = require('./src/config/firebase');

const projectsData = [
  // WATER & SANITATION
  {
    title: "Clean Water Initiative",
    description: "Providing access to clean drinking water in underserved communities through innovative filtration systems and infrastructure development.",
    category: "water",
    status: "active",
    progress: 65,
    imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    completionDate: "Q3 2025",
    isPublished: true,
    metrics: {
      livesImpacted: 8500,
      volunteersInvolved: 75
    }
  },

  // EDUCATION
  {
    title: "Digital Literacy Program",
    description: "Empowering communities through technology education and digital skills training for the modern workforce.",
    category: "education",
    status: "active",
    progress: 45,
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop",
    completionDate: "Q1 2026",
    isPublished: true,
    metrics: {
      livesImpacted: 3200,
      volunteersInvolved: 40
    }
  },
  {
    title: "Educational Infrastructure Development",
    description: "Building and renovating schools in rural areas to provide quality education facilities for children.",
    category: "education",
    status: "active",
    progress: 60,
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop",
    completionDate: "Q4 2025",
    isPublished: true,
    metrics: {
      livesImpacted: 6500,
      volunteersInvolved: 110
    }
  },

  // ENERGY
  {
    title: "Renewable Energy Access",
    description: "Installing solar panels and renewable energy solutions in remote areas to provide sustainable electricity.",
    category: "energy",
    status: "active",
    progress: 80,
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop",
    completionDate: "Q2 2025",
    isPublished: true,
    metrics: {
      livesImpacted: 12000,
      volunteersInvolved: 95
    }
  },

  // HEALTH
  {
    title: "Mental Health Support Network",
    description: "Establishing community-based mental health support systems and counseling services.",
    category: "health",
    status: "active",
    progress: 40,
    imageUrl: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&h=600&fit=crop",
    completionDate: "Q1 2026",
    isPublished: true,
    metrics: {
      livesImpacted: 4200,
      volunteersInvolved: 65
    }
  },
  {
    title: "Healthcare Access Expansion",
    description: "Mobile health clinics and telemedicine services reaching remote communities with essential healthcare.",
    category: "health",
    status: "completed",
    progress: 95,
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop",
    completionDate: "Q1 2025",
    isPublished: true,
    metrics: {
      livesImpacted: 45000,
      volunteersInvolved: 230
    }
  },

  // YOUTH DEVELOPMENT
  {
    title: "Youth Employment Training",
    description: "Vocational training programs designed to equip young adults with marketable skills and job opportunities.",
    category: "youth-development",
    status: "active",
    progress: 55,
    imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
    completionDate: "Q3 2025",
    isPublished: true,
    metrics: {
      livesImpacted: 2800,
      volunteersInvolved: 45
    }
  },

  // FOOD SECURITY
  {
    title: "Food Security Program",
    description: "Sustainable agriculture initiatives and food distribution networks fighting hunger in vulnerable populations.",
    category: "food",
    status: "completed",
    progress: 88,
    imageUrl: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800&h=600&fit=crop",
    completionDate: "Q2 2025",
    isPublished: true,
    metrics: {
      livesImpacted: 32000,
      volunteersInvolved: 180
    }
  },

  // WOMEN EMPOWERMENT
  {
    title: "Women's Empowerment Initiative",
    description: "Supporting women entrepreneurs through microfinance, business training, and mentorship programs.",
    category: "women-empowerment",
    status: "completed",
    progress: 92,
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop",
    completionDate: "Q3 2025",
    isPublished: true,
    metrics: {
      livesImpacted: 18500,
      volunteersInvolved: 145
    }
  },

  // ENVIRONMENT
  {
    title: "Urban Reforestation Project",
    description: "Planting trees and creating green spaces in urban areas to combat pollution and improve air quality.",
    category: "environment",
    status: "active",
    progress: 70,
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop",
    completionDate: "Q4 2025",
    isPublished: true,
    metrics: {
      livesImpacted: 15000,
      volunteersInvolved: 200
    }
  },

  // TECHNOLOGY
  {
    title: "Internet Connectivity for Rural Schools",
    description: "Bringing high-speed internet access to schools in remote areas to enable digital learning.",
    category: "technology",
    status: "planned",
    progress: 15,
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
    completionDate: "Q2 2026",
    isPublished: true,
    metrics: {
      livesImpacted: 5000,
      volunteersInvolved: 30
    }
  },

  // CYBERSECURITY
  {
    title: "Digital Safety Education",
    description: "Teaching communities about online safety, privacy protection, and cybersecurity best practices.",
    category: "cybersecurity",
    status: "active",
    progress: 35,
    imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=600&fit=crop",
    completionDate: "Q1 2026",
    isPublished: true,
    metrics: {
      livesImpacted: 7500,
      volunteersInvolved: 50
    }
  }
];

async function seedProjects() {
  console.log('🌱 Starting to seed projects...');
  
  try {
    const projectsCollection = db.collection('projects');
    
    for (const projectData of projectsData) {
      const data = {
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await projectsCollection.add(data);
      console.log(`✅ Created project: ${projectData.title} (ID: ${docRef.id})`);
    }
    
    console.log('\n🎉 Success! All projects created!');
    console.log(`📊 Total projects added: ${projectsData.length}`);
    
    // Calcular estatísticas
    const totalLives = projectsData.reduce((sum, p) => sum + p.metrics.livesImpacted, 0);
    const totalVolunteers = projectsData.reduce((sum, p) => sum + p.metrics.volunteersInvolved, 0);
    
    console.log(`\n📈 Statistics:`);
    console.log(`   - Total Lives Impacted: ${totalLives.toLocaleString()}`);
    console.log(`   - Total Volunteers: ${totalVolunteers.toLocaleString()}`);
    console.log(`   - Solutions: ${projectsData.filter(p => p.category === 'solutions').length}`);
    console.log(`   - Progress: ${projectsData.filter(p => p.category === 'progress').length}`);
    console.log(`   - Impact: ${projectsData.filter(p => p.category === 'impact').length}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding projects:', error);
    process.exit(1);
  }
}

seedProjects();