import { Request, Response } from 'express';
import Admin from '../models/Admin';
import Role, { getRoleModel } from '../models/Role';
import { getUserRoleModel } from '../models/UserRole';
import { AuthRequest } from '../types';
import bcrypt from 'bcryptjs';

export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const status = req.query.status as string;

    const query: any = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.isActive = status === 'active';
    }

    // Only get admin users
    query.role = { $in: ['super_admin', 'admin', 'sub_admin'] };

    const skip = (page - 1) * limit;

    const admins = await Admin.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Admin.countDocuments(query);

    res.json({
      success: true,
      data: {
        admins,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching admins',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAdmin = async (req: Request, res: Response) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');

    if (!admin || !['super_admin', 'admin', 'sub_admin'].includes(admin.role)) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    return res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching admin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;

    // Check if user already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    const admin = await Admin.create({
      email,
      password, // Let the model's pre-save middleware handle password hashing
      firstName,
      lastName,
      role: role || 'sub_admin',
      phone,
      isActive: true
    });

    // Create UserRole entry for the new admin
    try {
      const RoleModel = getRoleModel();
      const UserRoleModel = getUserRoleModel();
      const roleDoc = await RoleModel.findOne({ name: admin.role });
      if (roleDoc) {
        await UserRoleModel.create({
          userId: admin._id,
          roleId: roleDoc._id,
          moduleAccess: [],
          isActive: true,
          assignedBy: req.admin?.id || admin._id
        });
        console.log(`✅ Created UserRole entry for admin: ${admin.email}`);
      } else {
        console.warn(`⚠️ Role '${admin.role}' not found for admin: ${admin.email}`);
      }
    } catch (roleError) {
      console.error('Error creating UserRole entry:', roleError);
      // Don't fail the admin creation if UserRole creation fails
    }

    // Remove password from response
    const adminResponse = admin.toObject() as any;
    delete adminResponse.password;

    return res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: adminResponse
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error creating admin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { password, ...updateData } = req.body;

    // If password is being updated, include it (model will handle hashing)
    if (password) {
      updateData.password = password;
    }

    updateData.updatedBy = req.admin?.id;

    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    return res.json({
      success: true,
      message: 'Admin updated successfully',
      data: admin
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error updating admin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const adminToDelete = await Admin.findById(req.params.id);

    if (!adminToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent self-deletion
    if (adminToDelete._id.toString() === req.admin?.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Prevent deletion of super admin by non-super admin
    if (adminToDelete.role === 'super_admin' && req.admin?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can delete super admin accounts'
      });
    }

    await Admin.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting admin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const toggleAdminStatus = async (req: AuthRequest, res: Response) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent self-status change
    if (admin._id.toString() === req.admin?.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own status'
      });
    }

    // Prevent status change of super admin by non-super admin
    if (admin.role === 'super_admin' && req.admin?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can change super admin status'
      });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    const adminResponse = admin.toObject() as any;
    delete adminResponse.password;

    return res.json({
      success: true,
      message: `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
      data: adminResponse
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error toggling admin status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const adminQuery = { role: { $in: ['super_admin', 'admin', 'sub_admin'] } };
    
    const totalAdmins = await Admin.countDocuments(adminQuery);
    const activeAdmins = await Admin.countDocuments({ ...adminQuery, isActive: true });
    const inactiveAdmins = await Admin.countDocuments({ ...adminQuery, isActive: false });

    const roleStats = await Admin.aggregate([
      { $match: adminQuery },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentAdmins = await Admin.find(adminQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        overview: {
          totalAdmins,
          activeAdmins,
          inactiveAdmins
        },
        roleStats,
        recentAdmins
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching admin stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};