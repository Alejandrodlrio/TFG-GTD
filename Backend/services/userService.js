const db = require('../bd/pool.js')
const bcrypt = require('bcrypt');
const saltRounds = 10;

const userService = {}

userService.findUserById = async (id)=>{
    const res = await db.query('SELECT user_id, name, email FROM users WHERE user_id = $1', [id])

    if(res.rows.length != 1){
        throw new Error('The user does not exist');
    }

    return res.rows[0];
}

userService.register = async (userData) => {
    userData.email = userData.email.toLowerCase()
    console.log("User Data", userData);

    if(!await checkEmailExist(userData.email)){
        const hashpassw = await bcrypt.hash(userData.password, saltRounds);
    
        const res = await db.query("INSERT INTO public.users(user_id, name, email, password)" 
                    + "VALUES(nextval('users_user_id_seq'::regclass), $1, $2, $3)", [userData.name, userData.email, hashpassw]);
    
        return res.rowCount === 1;
    }

    return false
}

userService.login = async (userData) => {
    const userEmail = userData.email.toLowerCase();
    const userPass = userData.password;
    
    const res = await db.query('SELECT user_id, password FROM users WHERE email = $1', [userEmail]);
    
    if(res.rowCount === 1){
        const hashpassw = res.rows[0].password;
        const match = await bcrypt.compare(userPass, hashpassw);
        
        if(match){
            return res.rows[0].user_id;
        }
    }

    return -1;
}


//Aux functions
async function checkEmailExist(email){
    const res = await db.query('SELECT email FROM users WHERE email = $1', [email])

    return res.rowCount === 1;
}

module.exports = userService;