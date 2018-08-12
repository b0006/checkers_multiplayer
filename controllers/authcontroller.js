module.exports.signup = function(req,res){
    res.render('./pages/auth/signup');
};

module.exports.signin = function(req,res){
    res.render('./pages/auth/signin');
};

module.exports.signguest = function(req,res){
    console.log(req);
};


module.exports.logout = function(req,res){
    req.session.destroy(function(err) {
        res.redirect('/');
    });
};