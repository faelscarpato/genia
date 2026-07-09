class FamilyService {
  constructor(dbInstance) {
    this.db = dbInstance;
  }

  /**
   * Get all families for a specific user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of family objects
   */
  async getFamiliesForUser(userId) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return await this.db.getByIndex('families', 'ownerId', userId);
  }

  /**
   * Create a new family for a user
   * @param {Object} familyData - Family data to create
   * @returns {Promise<Object>} Created family object
   */
  async createFamily(familyData) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const family = {
      ...familyData,
      ownerId: familyData.ownerId || null,
      name: familyData.name || '',
      description: familyData.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return await this.db.add('families', family);
  }

  /**
   * Update a family by ID
   * @param {string} familyId - The family ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated family object
   */
  async updateFamily(familyId, updates) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const family = await this.db.get('families', familyId);
    if (!family) {
      throw new Error('Family not found');
    }
    const updatedFamily = {
      ...family,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return await this.db.put('families', updatedFamily);
  }

  /**
   * Delete a family by ID
   * @param {string} familyId - The family ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteFamily(familyId) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    await this.db.delete('families', familyId);
    return true;
  }

  /**
   * Get a family by ID
   * @param {string} familyId - The family ID
   * @returns {Promise<Object>} Family object
   */
  async getFamilyById(familyId) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return await this.db.get('families', familyId);
  }
}

export default FamilyService;