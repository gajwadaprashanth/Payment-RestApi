'use strict';

const firebase = require('../db');
const functions = require('firebase-functions')
var admin = require("firebase-admin");
var Tx = require('ethereumjs-tx').Transaction;

var serviceAccount = require("../serviceAccountKey.json"); 
console.log(serviceAccount);
const firestore = firebase.firestore();
const Student = require('../models/transaction');
var dateTime = require('node-datetime');
const Web3=require('web3')
var url="https://ropsten.infura.io/v3/91b956a485de4d7681f8c1e82c65b4b9"
const web3=new Web3(url)
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://autopay-425eb.firebaseio.com"
  });


const addtransaction = async (req, res, next) => {
    try {
        
        const id = req.params.id;
        const data = req.body;
        const merchantdata=req.body;
        const amount=data.amount;
        const name=data.to;
        console.log(amount)
        //var myTimestamp = firebase.firestore.Timestamp.fromDate(new Date())
        var dt = dateTime.create();
        var dt1=new Date();
     
     
        
        data.timestamp=dt1.valueOf();
        
          
       
        await firestore.collection('users').where("rfid","==",id).get().then( async function(querySnapshot) {
            let docid;
            querySnapshot.forEach( async function (document) {
                
              
                console.log(document.id, " => ", document.data());
                console.log(docid);
                var docdata=document.data();
                var token=docdata.token;
                var status=docdata.paymentstatus
              const account1=docdata.walletaddress
              const account2='0x62697b036fb68B61e15746eCf8950A823a1849F4'
              const privatekey=Buffer.from(docdata.privatekey,'hex')
                console.log(token)
                console.log(amount)
                if(status=="off"){
                  res.send("User disabled the rfid")
                }else{
                if(amount<500){
                  console.log("working in automatic mode")
                  await  web3.eth.getBalance(account1,(err,bal)=>{
                     console.log("from user account",web3.utils.fromWei(bal,'wei'))
                     if(bal<amount){
                       console.log("no enough balance ");
                       res.status(200).send("unsuccess")
                     }else{
                       try  {
                         var value=amount.toString();

                         const transaction= web3.eth.getTransactionCount(account1,async(err,txcount)=> {
                           const txobject={
                               nonce: web3.utils.toHex(txcount),
                               to: account2,
                               value: web3.utils.toHex(web3.utils.toWei(value,'szabo')),
                               gasLimit: web3.utils.toHex(21000),
                               gasPrice: web3.utils.toHex(web3.utils.toWei('10','gwei'))
                           }
                           const tx=new Tx(txobject,{chain:'ropsten', hardfork: 'petersburg'})
                           tx.sign(privatekey)
                           const serializedTransaction=tx.serialize()
                           const raw='0x'+serializedTransaction.toString('hex')
                           await  web3.eth.sendSignedTransaction(raw,async(err,txhash)=>{
                               console.log(err)
                               console.log('txhassh',txhash)
                               data.transactionhash=txhash;
                               if(err==null)
                               {  
                                 data.status="paid";
                                 
                                 console.log(docdata.userid)
                                await firestore.collection('users').doc(document.id).collection('transactions').doc().set(data)
                                await firestore.collection('merchants').doc('r5uYd9Q0yjII1AstWBsm').collection('transactions').doc().set({
                                  from: docdata.name,
                                  time: dt1.valueOf(),
                                  amount: amount,
                                  transactionhash: txhash

                              });
                                 
                                 
         
                                 var payload = {
                                   notification: {
                                     title: amount+"is paid to"+name,
                                     body: ""
                                   }
                                 };
                                 var options = {
                                   priority: "high",
                                   timeToLive: 60 * 60 *24
                                 };
                                 
                                 await admin.messaging().sendToDevice(token, payload, options)
                             .then(function(response) {
                             console.log("Successfully sent message:", response);
                             res.send('success');

                           })
                         .catch(function(error) {
                           console.log("Error sending message:", error);
                           res.status(200).send("Transaction Unsuccess")
                         });
                                  
                               }
                           })
                       })
                       }catch{
         
                       }
                       
                     }
         
                 
                   })
                 }
              else {
                console.log("working in notify mode")
                   var  storeddoc=  await firestore.collection('users').doc(document.id).collection('transactions').add(data);
                   var docid=storeddoc.id
               
                  

                    var payload = {
                    notification: {
                      title: name,
                      body: "Requesting amount of "+amount
                      }
                      };
                   
                      var options = {
                    priority: "high",
                    timeToLive: 60 * 60 *24
                      };
                  
                  await admin.messaging().sendToDevice(token, payload, options)
                    .then(function(response) {
                    console.log("Successfully sent message:", response);
             
                   })
               .catch(function(error) {
                console.log("Error sending message:", error);
            
                 });

               var userstatus="unpaid"
          

               await firestore.collection('users').doc(document.id).collection('transactions').doc(docid).onSnapshot(function(doc) {
                  
               console.log( " data: ", doc.data());
               var document=doc.data()
               userstatus=document.status;
               if(userstatus=="paid"){
                 res.status(200).send("success")
             
               }  
                });
         
                      setTimeout(()=>{
                        res.status(200).send("unsuccess")
                        },29000)
                        
                          console.log("over amount") 
                 }
                }      
            });
        }) 
        
        
       // res.status(200).send("success");
    } catch (error) {
        res.status(200).send("unsuccess");
    }
}
const testing=async(req,res,next)=>{
 res.send("its working")
  
}

const gettransaction=async(req,res,next)=>{
  const id = req.params.id;

  await firestore.collection('users').doc(id).collection('transactions').where("status","==","unpaid").get().then( async function(querySnapshot) {
    querySnapshot.forEach( async function (document) {
     
      console.log(document.id, " => ", document.data());
      const docdata=document.data()
      const user = await firestore.collection('users').doc(id).get();
      console.log(user.data())    
      res.send(docdata.to+" requesting an amount of "+ docdata.amount+" say confirm to make the payment ")
    })
  })
  
}
const maketransaction=async(req,res,next)=>{
  
  const id = req.params.id;
  var dt1=new Date();
  
 
  await firestore.collection('users').doc(id).collection('transactions').where("status","==","unpaid").get().then( async function(querySnapshot) {
    querySnapshot.forEach( async function (document) {
       
      const user = await firestore.collection('users').doc(id).get();
      console.log(user)
      const userdata=user.data()
      const token= userdata.token  
      const name=userdata.name        
      console.log(document.id, " => ", document.data());
      const docdata=document.data()
      const account1=userdata.walletaddress
      const account2='0x62697b036fb68B61e15746eCf8950A823a1849F4'
      const privatekey=Buffer.from(userdata.privatekey,'hex')
      //const name=docdata.from
      const docid= document.id
      const amount=docdata.amount;
      await  web3.eth.getBalance(account1,(err,bal)=>{
        console.log("from metamask account",web3.utils.fromWei(bal,'wei'))
        if(bal<amount){
          console.log("no enough balance ");
          res.status(200).send("unsuccess")
        }else{
          try  {
            var value=amount.toString();

            const transaction= web3.eth.getTransactionCount(account1,async(err,txcount)=> {
              const txobject={
                  nonce: web3.utils.toHex(txcount),
                  to: account2,
                  value: web3.utils.toHex(web3.utils.toWei(value,'szabo')),
                  gasLimit: web3.utils.toHex(21000),
                  gasPrice: web3.utils.toHex(web3.utils.toWei('10','gwei'))
              }
              const tx=new Tx(txobject,{chain:'ropsten', hardfork: 'petersburg'})
              tx.sign(privatekey)
              const serializedTransaction=tx.serialize()
              const raw='0x'+serializedTransaction.toString('hex')
              await  web3.eth.sendSignedTransaction(raw,async(err,txhash)=>{
                  console.log(err)
                  console.log('txhassh',txhash)
                  
                  if(err==null)
                  {  
                    
                    
                    
                   await firestore.collection('users').doc(id).collection('transactions').doc(docid).update({status: "paid",
                  transactionhash: txhash})
                   await firestore.collection('merchants').doc('r5uYd9Q0yjII1AstWBsm').collection('transactions').doc().set({
                     from: name,
                     time: dt1.valueOf(),
                     amount: amount,
                     transactionhash: txhash

                 });
                    
                    

                    var payload = {
                      notification: {
                        title: amount+"is paid to"+name,
                        body: ""
                      }
                    };
                    var options = {
                      priority: "high",
                      timeToLive: 60 * 60 *24
                    };
                    
                    await admin.messaging().sendToDevice(token, payload, options)
                .then(function(response) {
                console.log("Successfully sent message:", response);
                res.send('Transaction successful');

              })
            .catch(function(error) {
              console.log("Error sending message:", error);
              res.status(200).send("Transaction Unsuccess")
            });
                     
                  }
              })
          })
          }catch{

          }
          
        }

    
      })

    })
  })
  
}

const getuser=async(req,res,next)=>{
  const id = req.params.id;
  var data=0;
  await firestore.collection('users').where("rfid","==",id).get().then( async function(querySnapshot) {
    
    querySnapshot.forEach( async function (document) {
     
      console.log(document.id, " => ", document.data());
      const docdata=document.data()
      data=1;
      var status= docdata.paymentstatus
      
      if(status=="off") {
         res.send("user disabled rfid")
      }
      else{
      res.send(docdata.name)
      }
    
     // res.send('user not found')
    
    })
  })
  if(data==0){
    res.send("No user found")
  }
}

module.exports = {
    addtransaction,
    testing,
    gettransaction,
    maketransaction,
    getuser
}   