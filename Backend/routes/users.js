const express = require('express');
const router = express.Router();
const userService = require('../services/userService')
const userValidator = require('./validators/userValidator')
const checkValidations = require('./validators/validationUtils')
const util = require('util');


router.post('/register', userValidator.validateRegister(), checkValidations, async (req, res) =>{
  const userData = req.body;

  try{
    const ok = await userService.register(userData);
    res.send(ok);
  }catch (error){
    console.log('[Exception]:',error.message)
    res.sendStatus(500);
  }

})


router.post('/login', userValidator.validateLogin(), checkValidations, async (req, res) =>{
  const userData = req.body;

  try{
    const user_id = await userService.login(userData);

    if(user_id !== -1){
      const path = req.body.redirect || '/';
      return res.redirect('/oauth/authorize');
    }

    res.sendStatus(401);
  }catch (error){
    console.log('[Exception]:',error.message)
    res.sendStatus(500);
  }

})

router.get('/:id', async (req, res)=>{
  const id = req.params.id;

  try {
    const user = await userService.findUserById(id);
    res.send(user);
  } catch (error) {
    console.log('[Exception]:',error.message)
    res.sendStatus(404);
  }
})


module.exports = router;
