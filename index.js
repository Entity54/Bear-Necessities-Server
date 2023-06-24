'use strict';
require('dotenv').config();
const express = require('express');
const path = require('path');             
const http = require('http');     
const chalk = require('chalk');
const ethers = require('ethers');


const ordersManager_Moonbeam_raw = require('./Abis/OrdersManager.json');     
const executionOrdersEngineMoonbeam_raw = require('./Abis/ExecutionOrdersEngineMoonbeam.json');     

const ordersManager_Moonbeam_address = "0x9331d7e0F7deD78a21d6A3d381cdc95Da689AF79";
const executionOrdersEngine_Moonbeam_address = "0xce47EE729055A6EF5CCe58B2a319ed8035B90Dcf";


let moonbeam_signer,Moonbeam_RPC,Moonbeam_provider,moonbeam_wallet,OrdersManager_instance,ExecutionOrdersEngineMoonbeam_instance;
const set_Wallet = () => {
  console.log(`Setting up Wallet`);

  // Create a new Wallet instance with the private key
  moonbeam_signer = new ethers.Wallet(process.env.ACCOUNT_3000_PRIVATE_KEY);

  //RPC POINTS
  Moonbeam_RPC = "https://rpc.api.moonbeam.network";
  Moonbeam_provider = new ethers.providers.JsonRpcProvider(Moonbeam_RPC);
  moonbeam_wallet = moonbeam_signer.connect(Moonbeam_provider);

  //Set up contracts
  OrdersManager_instance =  new ethers.Contract( ordersManager_Moonbeam_address, ordersManager_Moonbeam_raw.abi, moonbeam_wallet);
  ExecutionOrdersEngineMoonbeam_instance = new ethers.Contract( executionOrdersEngine_Moonbeam_address, executionOrdersEngineMoonbeam_raw.abi, moonbeam_wallet);

}


const publicPath = path.join(__dirname,'./');       
const port = process.env.PORT || 3001;
var app = express();
app.use((req,res,next) => {
    next();
});
const server = http.createServer(app); 
app.use(express.static(publicPath)); 
console.log(`${new Date()} server is up`);



const update_StellaSwap_Prices = async () => {
	return new Promise (async (resolve,reject) => {

      // console.log(`********************* OrdersManager_instance SET STELLASWAP Prices Start ***********************************`);
      const gasEstimate = await OrdersManager_instance.estimateGas.get_StellaSwapPrice();
      const gasPremium = gasEstimate.mul(101).div(100);
      console.log(`update_StellaSwap_Prices => gasEstimate: ${gasEstimate} gasPremium: ${gasPremium}`);
  
      const tx =  await OrdersManager_instance.get_StellaSwapPrice({ gasLimit: gasPremium });

      try {
        const receipt = await tx.wait();
        if (receipt.status === false) {
          throw new Error("Transaction update_StellaSwap_Prices failed");
        }
        resolve({msg: ` => update_StellaSwap_Prices has updated successfuly at ${new Date()}`, code:1, error:""});
      }
      catch (error) {
        console.log(`update_StellaSwap_Prices ERROR 2 error: `,error);
        resolve({msg: ` => update_StellaSwap_Prices has Errored at ${new Date()} Error: `, code:0, error: error});
      }

  });

}

const checkLimitOrders = async () => {

	return new Promise (async (resolve,reject) => {

      // console.log(`*********************  checkLimitOrders Start ***********************************`);
      const gasEstimate = await OrdersManager_instance.estimateGas.checkLimitOrders();
      const gasPremium = gasEstimate.mul(130).div(100);
      console.log(`checkLimitOrders => gasEstimate: ${gasEstimate} gasPremium: ${gasPremium}`);
      
      const tx_checkLimitOrders =  await OrdersManager_instance.checkLimitOrders({ gasLimit: gasPremium });
      try {
        const receipt = await tx_checkLimitOrders.wait(); 
        if (receipt.status === false) {
          throw new Error("Transaction checkLimitOrders failed");
        }
        resolve({msg: ` => checkLimitOrders has updated successfuly at ${new Date()}`, code:1, error:""});
      }
      catch (e) {
        resolve({msg: ` => checkLimitOrders has Errored at ${new Date()} Error: `, code:0, error: e});
      }
  });

}


const checkStopOrders = async () => {

	return new Promise (async (resolve,reject) => {

      // console.log(`*********************  checkStopOrders Start ***********************************`);
      const gasEstimate = await OrdersManager_instance.estimateGas.checkStopOrders();
      const gasPremium = gasEstimate.mul(130).div(100);
      console.log(`checkStopOrders => gasEstimate: ${gasEstimate} gasPremium: ${gasPremium}`);

      const tx_checkStopOrders =  await OrdersManager_instance.checkStopOrders();
      try {
        const receipt = await tx_checkStopOrders.wait();
        if (receipt.status === false) {
          throw new Error("Transaction checkStopOrders failed");
        }
        resolve({msg: ` => checkStopOrders has updated successfuly at ${new Date()}`, code:1, error:""});
      }
      catch (e) {
        resolve({msg: ` => checkStopOrders has Errored at ${new Date()} Error: `, code:0, error: e});
      }

  });

}
const checkBracketOrders = async () => {

	return new Promise (async (resolve,reject) => {

      // console.log(`*********************  checkBracketOrders Start ***********************************`);
      const gasEstimate = await OrdersManager_instance.estimateGas.checkBracketOrders();
      const gasPremium = gasEstimate.mul(130).div(100);
      console.log(`checkBracketOrders => gasEstimate: ${gasEstimate} gasPremium: ${gasPremium}`);

      const tx_checkBracketOrders =  await OrdersManager_instance.checkBracketOrders();
      try {
        const receipt = await tx_checkBracketOrders.wait();
        if (receipt.status === false) {
          throw new Error("Transaction checkBracketOrders failed");
        }
        resolve({msg: ` => checkBracketOrders has updated successfuly at ${new Date()}`, code:1, error:""});
      }
      catch (e) {
        resolve({msg: ` => checkBracketOrders has Errored at ${new Date()} Error: `, code:0, error: e});
      }
  });

}

const checkDCAOrders = async () => {

	return new Promise (async (resolve,reject) => {

      // console.log(`*********************  checkDCAOrders Start ***********************************`);
      const gasEstimate = await OrdersManager_instance.estimateGas.checkDCAOrders();
      const gasPremium = gasEstimate.mul(130).div(100);
      console.log(`checkDCAOrders => gasEstimate: ${gasEstimate} gasPremium: ${gasPremium}`);

      const tx_checkDCAOrders =  await OrdersManager_instance.checkDCAOrders();
        try {
          const receipt = await tx_checkDCAOrders.wait();
          if (receipt.status === false) {
            throw new Error("Transaction checkDCAOrders failed");
          }
          resolve({msg: ` => checkDCAOrders has updated successfuly at ${new Date()}`, code:1, error:""});
      }
      catch (e) {
        resolve({msg: ` => checkDCAOrders has Errored at ${new Date()} Error: `, code:0, error: e});
      }
  });

}



const executeORDERSMoonbeam = async () => {
	return new Promise (async (resolve,reject) => {
      console.log(`*********************  executeORDERSMoonbeam Start ***********************************`);
      const message = await execute();
      console.log(`*********************  executeORDERSMoonbeam End *********************************** message: `,message);
      resolve({msg: ` => execute ORDERS Moonbeam has updated successfuly at ${new Date()}`, code:1, error:""});
  });

}

const execute = async () => {
	return new Promise (async (resolve,reject) => {

      const pendingOrders_MOONBEAM =  await ExecutionOrdersEngineMoonbeam_instance.get_pendingOrders_MOONBEAM();
      for (let i=0; i<pendingOrders_MOONBEAM.length; i++) console.log(`* pendingOrders_MOONBEAM[${i}]: ${pendingOrders_MOONBEAM[i]}`);
      
      if (pendingOrders_MOONBEAM.length>0)
      {
        const orderNonce = pendingOrders_MOONBEAM[0];
        console.log(`*** Will execute Moonbeam Order with nonce: ${orderNonce}`);
        try {
          const message = await execute_Order_Moonbeam(orderNonce);
          console.log(`execute MESSAGE 1001 message: `,message);

          await execute();
        }
        catch (someError) 
        {
          console.log(chalk.bgRed(`execute ERROR MESSAGE 2000 someError: `,someError));
        }
      }
      console.log(`End of Execute`);
      resolve(" 000 Execute has finished 000");

  });

}  


const execute_Order_Moonbeam = async (orderNonce) => {
	return new Promise (async (resolve,reject) => {

			console.log(`*********************  execute_Order_Moonbeam Start ***********************************`);
			const gasEstimate = await ExecutionOrdersEngineMoonbeam_instance.estimateGas.executeOrder_Moonbeam( orderNonce ); 
			const gasPremium = gasEstimate.mul(130).div(100);
			console.log(`execute_Order_Moonbeam => gasEstimate: ${gasEstimate} gasPremium: ${gasPremium} orderNonce: ${orderNonce}`);
	
			const tx =  await ExecutionOrdersEngineMoonbeam_instance.executeOrder_Moonbeam(orderNonce, { gasLimit: gasPremium });

      try {
        const receipt = await tx.wait();
        if (receipt.status === false) {
          throw new Error(`Transaction execute_Order_Moonbeam with orderNonce: ${orderNonce} failed`);
        }

        console.log(` execute_Order_Moonbeam orderNonce: ${orderNonce} has been mined`);
        resolve({msg: `  ===---> execute_Order_Moonbeam has updated successfuly at orderNonce: ${orderNonce} ${new Date()}`, code:1, error:""});

      }
      catch (er) {
          console.log(`execute_Order_Moonbeam ERROR MESSAGE er: `,er);
          resolve({msg: `  ===---> execute_Order_Moonbeam has E R R O R E D at orderNonce: ${orderNonce} ${new Date()}`, code:1, error:""});
      };

      
	});

}


// const executeORDERSMoonbeam = async () => {
// 	console.log(`*********************  executeORDERSMoonbeam Start ***********************************`);
//     try {
// 		const pendingOrders_MOONBEAM =  await ExecutionOrdersEngineMoonbeam_instance.get_pendingOrders_MOONBEAM();
// 		for (let i=0; i<pendingOrders_MOONBEAM.length; i++) console.log(`* pendingOrders_MOONBEAM[${i}]: ${pendingOrders_MOONBEAM[i]}`);
		
	
// 		for (let i=0; i<pendingOrders_MOONBEAM.length; i++)
// 		{
// 			const orderNonce = pendingOrders_MOONBEAM[i];
// 			console.log(`********************* Will execute Moonbeam Order with nonce: ${orderNonce}`);
// 			const message = await execute_Order_Moonbeam(orderNonce);
// 			console.log(`********************* Executed Moonbeam Order with nonce: ${orderNonce} message: `,message);
// 		}
// 	}
// 	catch (e) {
// 		console.log(` ********** while  executeORDERSMoonbeam an error occured ********** Error: `,e);
//   	}
// 	console.log(`*********************  executeORDERSMoonbeam End ***********************************`);
// }






const startServer = async () => {
  set_Wallet();

  const startProcess = async () => {
        const currentblock = await Moonbeam_provider.getBlock();
        const blockNum =  currentblock.number;
        let accountNonce = await Moonbeam_provider.getTransactionCount(process.env.ACCOUNT_3000_PUBLIC_KEY);
        console.log(chalk.cyan(`${new Date()} Starting Inpections at: ${blockNum} accountNonce: ${accountNonce}`)); 


        const message_update_StellaSwap_Prices = await update_StellaSwap_Prices();
        if (message_update_StellaSwap_Prices.code===1) console.log("1 ",message_update_StellaSwap_Prices.msg);
        else console.log(chalk.bgRed(message_update_StellaSwap_Prices.msg," ",message_update_StellaSwap_Prices.error)); 

        const message_checkLimitOrders = await checkLimitOrders();
        if (message_checkLimitOrders.code===1) console.log("2 ",message_checkLimitOrders.msg);
        else console.log(chalk.bgRed(message_checkLimitOrders.msg," ",message_checkLimitOrders.error)); 

        const message_checkStopOrders = await checkStopOrders();
        if (message_checkStopOrders.code===1) console.log("3 ",message_checkStopOrders.msg);
        else console.log(chalk.bgRed(message_checkStopOrders.msg," ",message_checkStopOrders.error)); 

        const message_checkBracketOrders = await checkBracketOrders();
        if (message_checkBracketOrders.code===1) console.log("4 ",message_checkBracketOrders.msg);
        else console.log(chalk.bgRed(message_checkBracketOrders.msg," ",message_checkBracketOrders.error)); 

        const message_checkDCAOrders = await checkDCAOrders();
        if (message_checkDCAOrders.code===1) console.log("5 ",message_checkDCAOrders.msg);
        else console.log(chalk.bgRed(message_checkDCAOrders.msg," ",message_checkDCAOrders.error)); 


        const message_executeORDERSMoonbeam = await executeORDERSMoonbeam();
        if (message_executeORDERSMoonbeam.code===1) console.log("6 ",message_executeORDERSMoonbeam.msg);
        else console.log(chalk.bgRed(message_executeORDERSMoonbeam.msg," ",message_executeORDERSMoonbeam.error)); 



        console.log(chalk.cyan(`Finished Inspections`));

        setTimeout(() => {
          startProcess()
        },15000);
  }  


  setTimeout(() => {
    startProcess()
  },15000);

}
startServer();


server.listen(port, () => {
  console.log(`HeartBeat Server is up on port ${port}`);
});





// NOTES
// Send the first transaction
// const tx1 = await signer.sendTransaction({
//   to: "0x1234567890abcdef",
//   value: ethers.utils.parseEther("0.01"),
//   nonce: nonce,
// });
// // Send the second transaction
// const tx2 = await signer.sendTransaction({
//   to: "0xabcdef1234567890",
//   value: ethers.utils.parseEther("0.02"),
//   nonce: nonce + 1,
// });