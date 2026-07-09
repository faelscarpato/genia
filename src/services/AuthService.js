import FamilyService from './FamilyService';
import { utils } from '../utils/utils';

class AuthService {
  constructor(dbInstance) {
    this.db = dbInstance;
  }

  /**
   * Register a new user
   * @param {Object} userData - User data (email, password, name, etc.)
   * @returns {Promise<Object>} Created user object
   */
  async register(userData) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Check if user already exists
    const existingUser = await this.getOneByIndex('users', 'email', userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = utils.hashPassword(userData.password);

    // Create user object
    const user = {
      id: utils.generateId(),
      email: userData.email,
      password: hashedPassword,
      name: userData.name || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    // Save to database
    await this.db.add('users', user);
    
    // Create default family for the user
    const familyService = new FamilyService(this.db);
    await familyService.createFamily({
      ownerId: user.id,
      name: `${user.name || user.email}'s Family`,
      description: 'Family tree created upon registration'
    });

    return { ...user, password: undefined }; // Return user without password
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User object if successful
   */
  async login(email, password) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Find user by email
    const user = await this.getOneByIndex('users', 'email', email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const hashedPassword = utils.hashPassword(password);
    if (user.password !== hashedPassword) {
      throw new Error('Invalid email or password');
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return await this.db.get('users', userId);
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user object
   */
  async updateUser(userId, updates) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const user = await this.db.get('users', userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await this.db.put('users', updatedUser);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    const user = await this.db.get('users', userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const hashedCurrentPassword = utils.hashPassword(currentPassword);
    if (user.password !== hashedCurrentPassword) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash new password and update
    const hashedNewPassword = utils.hashPassword(newPassword);
    user.password = hashedNewPassword;
    user.updatedAt = new Date().toISOString();
    
    await this.db.put('users', user);
  }

  /**
   * Helper method to get one record by index
   * @private
   */
  async getOneByIndex(storeName, indexName, value) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return await this.db.getOneByIndex(storeName, indexName, value);
  }
}

export default AuthService;