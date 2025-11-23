/**
 * Migration script to add new profile fields to existing users
 * Adds PSF profile fields while preserving existing data
 */

import { db } from './src/config/firebase.js';

const migrateUserFields = async () => {
  try {
    const usersCollection = db.collection('users');
    const snapshot = await usersCollection.get();

    if (snapshot.empty) {
      console.log('📋 No users found to migrate.');
      return;
    }

    console.log(`🔄 Starting migration for ${snapshot.docs.length} users...`);

    // New fields to add to all users
    const newFields = {
      // Basic Information
      firstName: '',
      lastName: '',
      linkedinUrl: '',
      country: '',
      state: '',
      city: '',
      introduction: '',
      introVideoUrl: '',
      accomplishment: '',
      education: '',
      employmentHistory: '',
      isTechnical: false,
      gender: '',
      birthdate: null,
      schedulingUrl: '',
      twitterUrl: '',
      instagramUrl: '',
      hearAboutPsf: '',

      // Projects and Initiatives
      hasProject: '', // 'committed', 'ideas', 'none'
      projectName: '',
      projectDescription: '',
      projectProgress: '',
      projectSupport: '',
      hasCollaborators: false,
      fullTimeReadiness: '', // 'already', 'ready', 'within_year', 'no_plans'
      responsibilityAreas: [],
      interestedTopics: [],
      collaborationExpectations: '',

      // Motivation and Values
      hobbies: '',
      lifePath: '',
      additionalInfo: '',

      // Migration metadata
      migratedAt: new Date()
    };

    let updatedCount = 0;

    for (const doc of snapshot.docs) {
      try {
        const userData = doc.data();

        // Only add fields that don't already exist
        const updateData = {};
        for (const [key, defaultValue] of Object.entries(newFields)) {
          if (!(key in userData)) {
            updateData[key] = defaultValue;
          }
        }

        if (Object.keys(updateData).length > 0) {
          await usersCollection.doc(doc.id).update(updateData);
          updatedCount++;
          console.log(`✅ Updated user: ${userData.email || userData.name || doc.id}`);
        } else {
          console.log(`⏭️  User already has new fields: ${userData.email || userData.name || doc.id}`);
        }
      } catch (error) {
        console.error(`❌ Error updating user ${doc.id}:`, error);
      }
    }

    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`📊 Updated ${updatedCount} out of ${snapshot.docs.length} users`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
};

migrateUserFields();