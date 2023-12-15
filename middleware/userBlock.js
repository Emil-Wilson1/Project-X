const logOutInMiddleware = async (req, res, next) => {
    try {
        // Clear user session
        req.session.user_id = null;

        // Redirect to the specified route
        res.redirect('/admin/userData');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    logOutInMiddleware,
};