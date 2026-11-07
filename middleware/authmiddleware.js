
function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: 'Please login first'
        });
    }

    next();
}

function isAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Admin access required'
        });
    }

    next();
}

module.exports = {
    isAuthenticated,
    isAdmin
};
