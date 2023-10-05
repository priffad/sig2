const jwt = require('jsonwebtoken');

const userAuthenticate = (req, res, next) => {
    // Ambil token dari header x-auth-token
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).send({ error: 'Authentication required.' });

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Authentication failed.' });
    }
};

const adminCheck = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).send({ error: 'Access forbidden. Admins only.' });
    }
    next();
};

module.exports = {
    userAuthenticate,
    adminCheck
};
