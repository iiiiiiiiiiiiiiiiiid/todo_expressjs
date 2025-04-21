import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sb from "./dbconn.js";

const NOT_SECRET = "abaNuvzp4yFajpPTqFjbkfgytu55l2ulU2F8";
const REFRESECRET = "h390r0urn3ih2034897t8uw3not8u892907t8y478y2vbo";

export const registerUser = async (req, res) => {
    const {username, password, email} = req.body;

    const hashPwd = await bcrypt.hash(password, 10);

    try {
        let { data, error } = await sb
            .rpc('user_add', {email_:email, pwd: hashPwd, uname: username,});

        if (error) {
            console.error('Supabase function error:', error);
            return res.status(500).json({ error: error.message });
        }
        res.json("OK");
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const loginUser = async (req, res) => {
    const {password, email} = req.body;
    let dbpwd; 
    try{
        const {data, error} = await sb.rpc(
            'user_find', {eml: email}
        );
        dbpwd = data[0].password;
        if(error) res.status(400).json({message: "Login is NO bueno"});
    } catch (err) {
        res.status(400).json({message: "Login is no bueno"});
        console.log("Right here");
    }

    if(!(await bcrypt.compare(password, dbpwd)))
        res.status(400).json({message: "Wrong password. Try again. Actually, don't try again."})

    const atoken = jwt.sign({email}, NOT_SECRET, {expiresIn: "15m"});
    const rtoken = jwt.sign({email}, REFRESECRET, {expiresIn: "3200d"});

    res.json({atoken, rtoken});
}

export const refreshUser = async (req, res) => {
    const {rtoken} = req.body;

    if(!rtoken) {
        return res.status(400).json({message: "You don't exist."});
    }

    try {
        const decoded = jwt.verify(rtoken, REFRESECRET);
        const newatoken = jwt.sign({email: decoded.email}, NOT_SECRET, {expiresIn: "15m"});
        res.json({atoken: newatoken});
    } catch(err) {
        
        return res.status(401).json({message: "I don't like your refresh token."});
    }
}

export const verifyToken = (req, res, next) => {
    const token = req.header("Authorization");

    if(!token) return res.status(401).json({message: "Bad request - no token"});

    try{
        const verified = jwt.verify(token.split(' ')[1], NOT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        console.error("FAIL:", err.name, err.message);
        res.status(401).json({message: "Unauthorized"});
    }
}