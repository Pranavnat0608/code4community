/**
 * Admin Configuration
 * Admin email for tutor management
 */

import { adminEmail } from '../keys.js';

export const ADMIN_CONFIG = {
  // Admin email from keys.js
  ADMIN_EMAIL: adminEmail,
  
  // Admin permissions
  PERMISSIONS: {
    MANAGE_TUTORS: 'manage_tutors',
    VIEW_ALL_SESSIONS: 'view_all_sessions',
    MANAGE_USERS: 'manage_users'
  }
};

/**
 * Check if a user is an admin based on their email
 * @param {string} email - User's email address
 * @returns {boolean} - True if user is admin
 */
export const isAdminEmail = (email) => {
  return email === ADMIN_CONFIG.ADMIN_EMAIL;
};

/**
 * Get admin configuration
 * @returns {object} - Admin configuration object
 */
export const getAdminConfig = () => {
  return ADMIN_CONFIG;
};
