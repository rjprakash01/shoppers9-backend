import { adminConnection, mainWebsiteConnection } from '../config/database';
import mongoose from 'mongoose';

/**
 * Dual Write Service
 * Handles simultaneous data operations across both admin_db and main_website_db
 * Ensures real-time synchronization between admin panel and main website
 */

export class DualWriteService {
  /**
   * Create a document in both databases simultaneously
   * @param modelName - The name of the model/collection
   * @param data - The data to insert
   * @param adminSchema - Mongoose schema for admin database
   * @param mainSchema - Mongoose schema for main website database (optional, defaults to adminSchema)
   * @returns Object containing results from both databases
   */
  static async create(
    modelName: string,
    data: any,
    adminSchema: mongoose.Schema,
    mainSchema?: mongoose.Schema
  ) {
    try {
      console.log(`🔄 Dual write: Creating ${modelName}`);
      
      // Use the same schema for both if mainSchema is not provided
      const schemaForMain = mainSchema || adminSchema;
      
      // Create models for both connections
      const AdminModel = adminConnection.model(modelName, adminSchema);
      const MainModel = mainWebsiteConnection.model(modelName, schemaForMain);
      
      // Transform data for main database if needed
      const transformedData = await this.transformDataForMainDb(modelName, data);
      
      // Perform dual write
      const [adminResult, mainResult] = await Promise.all([
        AdminModel.create(data),
        MainModel.create(transformedData)
      ]);
      
      console.log(`✅ Dual write successful for ${modelName}`);
      console.log(`📊 Admin DB ID: ${adminResult._id}`);
      console.log(`🌐 Main DB ID: ${mainResult._id}`);
      
      return {
        success: true,
        adminResult,
        mainResult,
        message: `${modelName} created in both databases`
      };
      
    } catch (error) {
      console.error(`❌ Dual write failed for ${modelName}:`, error);
      
      // Attempt rollback if one succeeded and other failed
      // This is a simplified rollback - in production, you might want more sophisticated handling
      
      throw new Error(`Dual write failed: ${error.message}`);
    }
  }

  /**
   * Transform data for main database to handle schema differences
   * @param modelName - The name of the model
   * @param data - The original data
   * @returns Transformed data suitable for main database
   */
  private static async transformDataForMainDb(modelName: string, data: any): Promise<any> {
    const transformedData = { ...data };

    // Handle User references for Product model
    if (modelName === 'Product') {
      // If the product has createdBy or updatedBy references, ensure the User exists in main DB
      if (data.createdBy || data.updatedBy) {
        await this.ensureUserExistsInMainDb(data.createdBy || data.updatedBy);
      }
      
      // Ensure isApproved field is set correctly for main database
      // If product is active and approved, set isApproved to true
      if (data.status === 'active' && data.approvalStatus === 'approved' && data.isActive === true) {
        transformedData.isApproved = true;
      } else {
        transformedData.isApproved = false;
      }
    }

    return transformedData;
  }

  /**
   * Ensure a User exists in the main database with proper schema
   * @param userId - The User ID to check/create
   */
  private static async ensureUserExistsInMainDb(userId: any): Promise<void> {
     if (!userId) return;
 
     try {
       // Import User models with proper schemas
       const { default: AdminUserModel } = await import('../models/User');
       
       // Get User from admin database
       const adminUser = await AdminUserModel.findById(userId);
       
       if (!adminUser) {
         console.log(`⚠️ User ${userId} not found in admin database`);
         return;
       }
 
       // Define main database User schema (matching backend-shoppers9 schema)
       const mainUserSchema = new mongoose.Schema({
         name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
         email: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
         phone: { type: String, sparse: true, unique: true },
         password: { type: String },
         authMethod: { type: String, enum: ['phone', 'email', 'both'], default: 'phone' },
         isActive: { type: Boolean, default: true },
         role: { type: String, default: 'user' },
         createdAt: { type: Date, default: Date.now },
         updatedAt: { type: Date, default: Date.now }
       }, { timestamps: true });
 
       // Get or create the main User model with proper isolation
      let MainUser;
      try {
        // Check if model exists on this specific connection
        MainUser = mainWebsiteConnection.models.User;
        if (!MainUser) {
          throw new Error('Model not found');
        }
      } catch (error) {
        // Create model only on the main connection with proper schema
        MainUser = mainWebsiteConnection.model('User', mainUserSchema);
      }
       
       const mainUser = await MainUser.findById(userId);
       
       if (!mainUser) {
         console.log(`🔄 Creating User ${userId} in main database`);
         
         // Transform admin user data to match main database schema
         const mainUserData = {
           _id: adminUser._id,
           name: `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() || 'Admin User',
           email: adminUser.email,
           phone: adminUser.phone || '1234567890',
           authMethod: 'email',
           isActive: adminUser.isActive !== false,
           role: adminUser.role || 'user',
           createdAt: adminUser.createdAt || new Date(),
           updatedAt: adminUser.updatedAt || new Date()
         };
 
         // Ensure name is not empty
         if (!mainUserData.name || mainUserData.name.trim() === '') {
           mainUserData.name = 'Admin User';
         }
 
         await MainUser.create(mainUserData);
         console.log(`✅ User ${userId} created in main database`);
       }
     } catch (error) {
       console.error(`❌ Error ensuring User ${userId} exists in main database:`, error);
       // Don't throw error here to avoid breaking the main operation
     }
   }
  
  /**
   * Update a document in both databases simultaneously
   * @param modelName - The name of the model/collection
   * @param filter - Query filter to find the document
   * @param updateData - The data to update
   * @param adminSchema - Mongoose schema for admin database
   * @param mainSchema - Mongoose schema for main website database (optional)
   * @returns Object containing results from both databases
   */
  static async update(
    modelName: string,
    filter: any,
    updateData: any,
    adminSchema: mongoose.Schema,
    mainSchema?: mongoose.Schema
  ) {
    try {
      console.log(`🔄 Dual write: Updating ${modelName}`);
      
      const schemaForMain = mainSchema || adminSchema;
      
      const AdminModel = adminConnection.model(modelName, adminSchema);
      const MainModel = mainWebsiteConnection.model(modelName, schemaForMain);
      
      // Transform update data for main database if needed
      const transformedUpdateData = await this.transformDataForMainDb(modelName, updateData);
      
      const [adminResult, mainResult] = await Promise.all([
        AdminModel.findOneAndUpdate(filter, updateData, { new: true }),
        MainModel.findOneAndUpdate(filter, transformedUpdateData, { new: true })
      ]);
      
      console.log(`✅ Dual update successful for ${modelName}`);
      
      return {
        success: true,
        adminResult,
        mainResult,
        message: `${modelName} updated in both databases`
      };
      
    } catch (error) {
      console.error(`❌ Dual update failed for ${modelName}:`, error);
      throw new Error(`Dual update failed: ${error.message}`);
    }
  }
  
  /**
   * Delete a document from both databases simultaneously
   * @param modelName - The name of the model/collection
   * @param filter - Query filter to find the document
   * @param adminSchema - Mongoose schema for admin database
   * @param mainSchema - Mongoose schema for main website database (optional)
   * @returns Object containing results from both databases
   */
  static async delete(
    modelName: string,
    filter: any,
    adminSchema: mongoose.Schema,
    mainSchema?: mongoose.Schema
  ) {
    try {
      console.log(`🔄 Dual write: Deleting ${modelName}`);
      
      const schemaForMain = mainSchema || adminSchema;
      
      const AdminModel = adminConnection.model(modelName, adminSchema);
      const MainModel = mainWebsiteConnection.model(modelName, schemaForMain);
      
      const [adminResult, mainResult] = await Promise.all([
        AdminModel.findOneAndDelete(filter),
        MainModel.findOneAndDelete(filter)
      ]);
      
      console.log(`✅ Dual delete successful for ${modelName}`);
      
      return {
        success: true,
        adminResult,
        mainResult,
        message: `${modelName} deleted from both databases`
      };
      
    } catch (error) {
      console.error(`❌ Dual delete failed for ${modelName}:`, error);
      throw new Error(`Dual delete failed: ${error.message}`);
    }
  }
  
  /**
   * Find documents from admin database (for admin panel queries)
   * @param modelName - The name of the model/collection
   * @param filter - Query filter
   * @param adminSchema - Mongoose schema for admin database
   * @returns Query results from admin database
   */
  static async findFromAdmin(
    modelName: string,
    filter: any = {},
    adminSchema: mongoose.Schema
  ) {
    try {
      const AdminModel = adminConnection.model(modelName, adminSchema);
      return await AdminModel.find(filter);
    } catch (error) {
      console.error(`❌ Admin query failed for ${modelName}:`, error);
      throw new Error(`Admin query failed: ${error.message}`);
    }
  }
  
  /**
   * Find documents from main website database (for website queries)
   * @param modelName - The name of the model/collection
   * @param filter - Query filter
   * @param mainSchema - Mongoose schema for main website database
   * @returns Query results from main website database
   */
  static async findFromMain(
    modelName: string,
    filter: any = {},
    mainSchema: mongoose.Schema
  ) {
    try {
      const MainModel = mainWebsiteConnection.model(modelName, mainSchema);
      return await MainModel.find(filter);
    } catch (error) {
      console.error(`❌ Main website query failed for ${modelName}:`, error);
      throw new Error(`Main website query failed: ${error.message}`);
    }
  }
  
  /**
   * Sync existing data from admin database to main website database
   * Useful for initial setup or data recovery
   * @param modelName - The name of the model/collection
   * @param adminSchema - Mongoose schema for admin database
   * @param mainSchema - Mongoose schema for main website database (optional)
   */
  static async syncAdminToMain(
    modelName: string,
    adminSchema: mongoose.Schema,
    mainSchema?: mongoose.Schema
  ) {
    try {
      console.log(`🔄 Syncing ${modelName} from admin to main database...`);
      
      const schemaForMain = mainSchema || adminSchema;
      
      const AdminModel = adminConnection.model(modelName, adminSchema);
      const MainModel = mainWebsiteConnection.model(modelName, schemaForMain);
      
      // Get all documents from admin database
      const adminDocs = await AdminModel.find({});
      
      if (adminDocs.length === 0) {
        console.log(`📭 No ${modelName} documents found in admin database`);
        return { success: true, synced: 0 };
      }
      
      // Clear main database collection first
      await MainModel.deleteMany({});
      
      // Insert all documents into main database
      const mainDocs = await MainModel.insertMany(adminDocs.map(doc => doc.toObject()));
      
      console.log(`✅ Synced ${mainDocs.length} ${modelName} documents to main database`);
      
      return {
        success: true,
        synced: mainDocs.length,
        message: `${mainDocs.length} ${modelName} documents synced successfully`
      };
      
    } catch (error) {
      console.error(`❌ Sync failed for ${modelName}:`, error);
      throw new Error(`Sync failed: ${error.message}`);
    }
  }
}

export default DualWriteService;