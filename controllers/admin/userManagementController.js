const User = require('../../models/User');

// User management
exports.userManagement = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        // Search query
        let query = {};
        if (search) {
            query = {
                $or: [
                    { fullname: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { mobile: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Get users
        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Total count
        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);

        res.render('admin/user-management', {
            title: 'User Management',
            admin: req.session.admin,
            users,
            currentPage: page,
            totalPages,
            totalUsers,
            limit,
            search,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1
        });

    } catch (error) {
        console.error('User management error:', error);
        res.status(500).render('admin/error', {
            title: 'Error',
            admin: req.session.admin,
            message: 'Error loading user management page'
        });
    }
};

// Block user
exports.blockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        await User.findByIdAndUpdate(userId, { 
            isBlocked: true 
        });

        res.json({ 
            success: true, 
            message: 'User blocked successfully' 
        });

    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error blocking user' 
        });
    }
};

// Unblock user
exports.unblockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        await User.findByIdAndUpdate(userId, { 
            isBlocked: false 
        });

        res.json({ 
            success: true, 
            message: 'User unblocked successfully' 
        });

    } catch (error) {
        console.error('Unblock user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error unblocking user' 
        });
    }
};