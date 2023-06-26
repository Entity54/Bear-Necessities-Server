'use strict';
require('dotenv').config();
const express = require('express');
const path = require('path');             
const http = require('http');     
const chalk = require('chalk');
const ethers = require('ethers');


const ordersManager_Moonbeam_raw = require('./Abis/OrdersManager.json');     
const executionOrdersEngineMoonbeam_raw = require('./Abis/ExecutionOrdersEngineMoonbeam.json'); 
const axelarFantomSatelite_raw = require('./Abis/AxelarFantomSatelite.json');     
const axelarMoonbeamSatelite_raw = require('./Abis/AxelarMoonbeamSatelite.json');     
const executionOrdersEngineFromFantom_raw = require('./Abis/ExecutionOrdersEngineFromFantom.json');     
// const UsersRegistry_raw = require('./Abis/UsersRegistry.json');     

// MOONBEAM
const ordersManager_Moonbeam_address =  "0x3357e0d9d3eF81Bc6b158313416de8879F2EDcF6"; //"0x9331d7e0F7deD78a21d6A3d381cdc95Da689AF79";
const usersRegistry_Moonbeam_address = "0xC11029E655456618bC9FaDFF92B52D99863A9A55";
const executionOrdersEngine_Moonbeam_address = "0xce47EE729055A6EF5CCe58B2a319ed8035B90Dcf";
const executionOrdersEngineFromFantom_address = "0xc259A95E717ccf5aEDA5971CE967E528Fa624Bc4";
const axelarMoonbeamSatelite_address = "0xb85E1D77d6430bBDAF91845181440407c3c2bf6b";

//FANTOM 
const axelarFantomSatelite_address = "0x27d7222AD292d017C6eE1f0B8043Da7F4424F6a0";


let moonbeam_signer,Moonbeam_RPC,Moonbeam_provider,moonbeam_wallet,OrdersManager_instance,ExecutionOrdersEngineMoonbeam_instance, ExecutionOrdersEngineFromFantom_instance, AxelarMoonbeamSatelite_instance;
let fantom_signer,Fantom_RPC,Fantom_provider,fantom_wallet, AxelarFantomSatelite_instance;
const set_Wallet = () => {
  console.log(`Setting up Wallet`);

  // Create a new Wallet instance with the private key
  moonbeam_signer = new ethers.Wallet(process.env.ACCOUNT_3000_PRIVATE_KEY);
  fantom_signer = new ethers.Wallet(process.env.ACCOUNT_3000_PRIVATE_KEY);


  //MOONBEAM
  Moonbeam_RPC = "https://rpc.api.moonbeam.network";
  Moonbeam_provider = new ethers.providers.JsonRpcProvider(Moonbeam_RPC);
  moonbeam_wallet = moonbeam_signer.connect(Moonbeam_provider);
  
  //FANTOM
  Fantom_RPC = "https://rpc.ankr.com/fantom/";
  Fantom_provider = new ethers.providers.JsonRpcProvider(Fantom_RPC);
  fantom_wallet = fantom_signer.connect(Fantom_provider);

  //Set up contracts
  //MOONBEAM
  OrdersManager_instance =  new ethers.Contract( ordersManager_Moonbeam_address, ordersManager_Moonbeam_raw.abi, moonbeam_wallet);
  ExecutionOrdersEngineMoonbeam_instance = new ethers.Contract( executionOrdersEngine_Moonbeam_address, executionOrdersEngineMoonbeam_raw.abi, moonbeam_wallet);
  // const UsersRegistryMoonbeam_instance =  new ethers.Contract( usersRegistry_Moonbeam_address, usersRegistry_Moonbeam_raw.abi, moonbeam_wallet);
  
  ExecutionOrdersEngineFromFantom_instance = new ethers.Contract(executionOrdersEngineFromFantom_address, executionOrdersEngineFromFantom_raw.abi, moonbeam_wallet);
  AxelarMoonbeamSatelite_instance = new ethers.Contract(axelarMoonbeamSatelite_address, axelarMoonbeamSatelite_raw.abi, moonbeam_wallet);
  //FANTOM
  AxelarFantomSatelite_instance  = new ethers.Contract(axelarFantomSatelite_address, axelarFantomSatelite_raw.abi, fantom_wallet);

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


//BALANCES
const getServerAccountBalances = async () => {
  const GLMR_balance_WEI = await Moonbeam_provider.getBalance(process.env.ACCOUNT_3000_PUBLIC_KEY);
  const FTM_balance_WEI  = await Fantom_provider.getBalance(process.env.ACCOUNT_3000_PUBLIC_KEY);

  const GLMR_balance = ethers.utils.formatEther(GLMR_balance_WEI);
  const FTM_balance  = ethers.utils.formatEther(FTM_balance_WEI);

  return {GLMR_balance, FTM_balance};
}


//FANTOM AUTOMATIONS
const requestOrderAXLUSDCfinancing = async () => {

	return new Promise (async (resolve,reject) => {

      console.log(`*********************  requestOrderAXLUSDCfinancing Start ***********************************`);

      let finance_orderNonces =  await AxelarFantomSatelite_instance.get_finance_orderNonces();
      console.log(` =-----> finance_orderNonces: `,finance_orderNonces);

      if (finance_orderNonces.length > 0)
      {

          const tx =  await AxelarFantomSatelite_instance.requestOrderAXLUSDCfinancing();
         
          try {
            const receipt = await tx.wait();
            if (receipt.status === false) {
              throw new Error(`Transaction requestOrderAXLUSDCfinancing failed`);
            }
    
            console.log(` requestOrderAXLUSDCfinancing has been mined`);
            resolve({msg: `  ===---> requestOrderAXLUSDCfinancing has updated successfuly  ${new Date()}`, code:1, error:""});
    
          }
          catch (er) {
              console.log(`requestOrderAXLUSDCfinancing ERROR MESSAGE er: `,er);
              resolve({msg: `  ===---> requestOrderAXLUSDCfinancing has E R R O R E D at ${new Date()}`, code:1, error: er});
          };

      }
      else 
      {
        console.log(` requestOrderAXLUSDCfinancing No Need To Run`);
        resolve({msg: `  ===---> requestOrderAXLUSDCfinancing No Need To Run  ${new Date()}`, code:1, error:""});
      }

  });

}


const financeOrdersTo_Execute = async () => {

	return new Promise (async (resolve,reject) => {

      console.log(`*********************  financeOrdersTo_Execute Start ***********************************`);

      const finance_Order_Nonces_ToSend =  await AxelarFantomSatelite_instance.get_finance_Order_Nonces_ToSend();
      console.log(` =-----> finance_Order_Nonces_ToSend: `,finance_Order_Nonces_ToSend);

      if (finance_Order_Nonces_ToSend.length > 0)
      {
          console.log(` ===> WILL NOW RUN financeOrdersTo_Execute BECAUSE finance_Order_Nonces_ToSend.length: ${finance_Order_Nonces_ToSend.length} > 0 <===`);

          const tx =  await AxelarFantomSatelite_instance.financeOrdersTo_Execute( {value: ethers.utils.parseEther("1.0")} );
          
          try {
            const receipt = await tx.wait();
            if (receipt.status === false) {
              throw new Error(`Transaction financeOrdersTo_Execute failed`);
            }
    
            console.log(` financeOrdersTo_Execute has been mined`);
            resolve({msg: `  ===---> financeOrdersTo_Execute has updated successfuly  ${new Date()}`, code:1, error:""});
    
          }
          catch (er) {
              console.log(`financeOrdersTo_Execute ERROR MESSAGE er: `,er);
              resolve({msg: `  ===---> financeOrdersTo_Execute has E R R O R E D at ${new Date()}`, code:1, error: er});
          };

      }
      else 
      {
        console.log(` financeOrdersTo_Execute No Need To Run`);
        resolve({msg: `  ===---> financeOrdersTo_Execute No Need To Run  ${new Date()}`, code:1, error:""});
      }

  });

}


const financeOrdersTo_Delete = async () => {

	return new Promise (async (resolve,reject) => {

      console.log(`*********************  financeOrdersTo_Delete Start ***********************************`);

      const finance_Order_Nonces_ToDelete =  await AxelarFantomSatelite_instance.get_finance_Order_Nonces_ToDelete();
      console.log(` =-----> finance_Order_Nonces_ToDelete: `,finance_Order_Nonces_ToDelete);


      if (finance_Order_Nonces_ToDelete.length > 0)
      {
          console.log(` ===> WILL NOW RUN finance_Order_Nonces_ToDelete BECAUSE finance_Order_Nonces_ToDelete.length: ${finance_Order_Nonces_ToDelete.length} > 0 <===`);

          const tx =  await AxelarFantomSatelite_instance.financeOrdersTo_Delete( {value: ethers.utils.parseEther("1.0")} );

          try {
            const receipt = await tx.wait();
            if (receipt.status === false) {
              throw new Error(`Transaction financeOrdersTo_Delete failed`);
            }
    
            console.log(` financeOrdersTo_Delete has been mined`);
            resolve({msg: `  ===---> financeOrdersTo_Delete has updated successfuly  ${new Date()}`, code:1, error:""});
    
          }
          catch (er) {
              console.log(`financeOrdersTo_Delete ERROR MESSAGE er: `,er);
              resolve({msg: `  ===---> financeOrdersTo_Delete has E R R O R E D at ${new Date()}`, code:1, error: er});
          };

      }
      else 
      {
        console.log(` financeOrdersTo_Delete No Need To Run`);
        resolve({msg: `  ===---> financeOrdersTo_Delete No Need To Run  ${new Date()}`, code:1, error:""});
      }

  });

}


//MOONBEAM AXELAR
const requestPendingOrdersFinancing = async () => {
	return new Promise (async (resolve,reject) => {

      console.log(`*********************  requestPendingOrdersFinancing ExecutionOrdersEngineFromFantom_instance Start ***********************************`);

      const pendingOrders_FromFANTOM_USDC =  await ExecutionOrdersEngineFromFantom_instance.get_pendingOrders_FromFANTOM_USDC();
      console.log(` =-----> pendingOrders_FromFANTOM_USDC: `,pendingOrders_FromFANTOM_USDC);

      if (pendingOrders_FromFANTOM_USDC.length > 0)
      {
          console.log(` ===> WILL NOW RUN requestPendingOrdersFinancing ExecutionOrdersEngineFromFantom_instance BECAUSE pendingOrders_FromFANTOM_USDC.length: ${pendingOrders_FromFANTOM_USDC.length} > 0 <===`);

          const tx =  await ExecutionOrdersEngineFromFantom_instance.requestPendingOrdersFinancing( {value: ethers.utils.parseEther("1.5")} );

          try {
            const receipt = await tx.wait();
            if (receipt.status === false) {
              throw new Error(`Transaction requestPendingOrdersFinancing failed`);
            }
    
            console.log(` requestPendingOrdersFinancing has been mined`);
            resolve({msg: `  ===---> requestPendingOrdersFinancing has updated successfuly  ${new Date()}`, code:1, error:""});
    
          }
          catch (er) {
              console.log(`requestPendingOrdersFinancing ERROR MESSAGE er: `,er);
              resolve({msg: `  ===---> requestPendingOrdersFinancing has E R R O R E D at ${new Date()}`, code:1, error: er});
          };

      }
      else 
      {
        console.log(` requestPendingOrdersFinancing No Need To Run`);
        resolve({msg: `  ===---> requestPendingOrdersFinancing No Need To Run  ${new Date()}`, code:1, error:""});
      }

  });

}


const delete_Unfinanced_Orders = async () => {
	return new Promise (async (resolve,reject) => {

      console.log(`*********************  delete_Unfinanced_Orders ExecutionOrdersEngineFromFantom_instance Start ***********************************`);
      
      // ONLY TO SAVE ON FEES
      const unfinancedOrderNoncesToDelete =  await ExecutionOrdersEngineFromFantom_instance.get_unfinancedOrderNoncesToDelete();
      console.log(` =-----> unfinancedOrderNoncesToDelete: `,unfinancedOrderNoncesToDelete);

      if (unfinancedOrderNoncesToDelete.length > 0)
      {
          console.log(` ===> WILL NOW RUN delete_Unfinanced_Orders ExecutionOrdersEngineFromFantom_instance BECAUSE unfinancedOrderNoncesToDelete.length: ${unfinancedOrderNoncesToDelete.length} > 0 <===`);

          const tx =  await ExecutionOrdersEngineFromFantom_instance.delete_Unfinanced_Orders();

          try {
            const receipt = await tx.wait();
            if (receipt.status === false) {
              throw new Error(`Transaction delete_Unfinanced_Orders failed`);
            }
    
            console.log(` delete_Unfinanced_Orders has been mined`);
            resolve({msg: `  ===---> delete_Unfinanced_Orders has updated successfuly  ${new Date()}`, code:1, error:""});
    
          }
          catch (er) {
              console.log(`delete_Unfinanced_Orders ERROR MESSAGE er: `,er);
              resolve({msg: `  ===---> delete_Unfinanced_Orders has E R R O R E D at ${new Date()}`, code:1, error: er});
          };

      }
      else 
      {
        console.log(` delete_Unfinanced_Orders No Need To Run`);
        resolve({msg: `  ===---> delete_Unfinanced_Orders No Need To Run  ${new Date()}`, code:1, error:""});
      }

  });

}



// Collects all Orders submitted from Fantom to Swapp USDC to Token that have already received axlUSDC / USDC financing
let arrayOf_orderNonces_financedwithUSDC = [];
const executeORDERSMoonbeam_FromFatnomWithUSDC = async () => {
	return new Promise (async (resolve,reject) => {
      console.log(`*********************  executeORDERSMoonbeam_FromFatnomWithUSDC Start ***********************************`);
      
      arrayOf_orderNonces_financedwithUSDC = await get_FantomFinancedOrderWithUSD_Nonces();
      console.log(` executeORDERSMoonbeam_FromFatnomWithUSDC Got arrayOf_orderNonces_financedwithUSDC: `,arrayOf_orderNonces_financedwithUSDC);
      
      const message = await execute_OrdersFromFantom_BuyWithUSDC();
      
      console.log(`*********************  executeORDERSMoonbeam_FromFatnomWithUSDC End *********************************** message: `,message);
      resolve({msg: ` => executeORDERSMoonbeam_FromFatnomWithUSDC has updated successfuly at ${new Date()}`, code:1, error:""});
  });

}

const get_FantomFinancedOrderWithUSD_Nonces = async () => {
  let orderNonces_financedwithUSDC = [];
  const pendingFinancedOrders_FromFANTOM_USDC =  await ExecutionOrdersEngineFromFantom_instance.get_pendingFinancedOrders_FromFANTOM_USDC();
  console.log(` =-----> pendingFinancedOrders_FromFANTOM_USDC: `,pendingFinancedOrders_FromFANTOM_USDC);

  for (let i=0; i<pendingFinancedOrders_FromFANTOM_USDC.length; i++)
  {
      let ord =  await ExecutionOrdersEngineFromFantom_instance.Orders(pendingFinancedOrders_FromFANTOM_USDC[i]);
      console.log(` =-----> pendingFinancedOrders_FromFANTOM_USDC[${i}]  : ${pendingFinancedOrders_FromFANTOM_USDC[i]} ord.IsFinanced: ${ord.IsFinanced} engine_nonce: ${ord.engine_nonce}  origin_nonce: ${ord.origin_nonce} owner: ${ord.owner} tokenIn: ${`${ord.tokenIn}`.substring(0,5)}...${`${ord.tokenIn}`.substring(36)} tokenOut: ${`${ord.tokenOut}`.substring(0,5)}...${`${ord.tokenOut}`.substring(36)} limit_price: ${ord.limit_price} stop_price: ${ord.stop_price} size: ${ord.size} block_submitted: ${ord.block_submitted} numOfsplits: ${ord.numOfsplits} order_type: ${ord.order_type} positionAr: ${ord.positionAr}`);
      if (ord.IsFinanced ) orderNonces_financedwithUSDC.push(ord.engine_nonce);
  }
  console.log("orderNonces_financedwithUSDC: ",orderNonces_financedwithUSDC);
  return orderNonces_financedwithUSDC;
}


const execute_OrdersFromFantom_BuyWithUSDC = async () => {
	return new Promise (async (resolve,reject) => {
    console.log("arrayOf_orderNonces_financedwithUSDC: ",arrayOf_orderNonces_financedwithUSDC);
      
    if (arrayOf_orderNonces_financedwithUSDC.length>0)
    {
      
      const orderNonce = arrayOf_orderNonces_financedwithUSDC[ arrayOf_orderNonces_financedwithUSDC.length - 1 ];
      console.log(`*** Will execute Moonbeam Order from Fatnom with USDC with nonce: ${orderNonce}`);

      try {
        const message = await executeOrder_Moonbeam_BuyWithUSDC(orderNonce);
        console.log(`execute_OrdersFromFantom_BuyWithUSDC MESSAGE 300 message: `,message);
        arrayOf_orderNonces_financedwithUSDC.pop();

        await execute_OrdersFromFantom_BuyWithUSDC();
      }
      catch (someError) 
      {
        console.log(chalk.bgRed(`execute_OrdersFromFantom_BuyWithUSDC ERROR MESSAGE 5000 someError: `,someError));
      }
    }
    console.log(`End of execute_OrdersFromFantom_BuyWithUSDC`);
    resolve(" 000 execute_OrdersFromFantom_BuyWithUSDC has finished 000");

  });

}  

// THIS TELLS YOU IF THERE ARE ANY ORDERS READY TO BE EXECUTED FROM USDC TO TOKEN => READ NONCE THEN CALL FUNCTION BELOW TO EXECUTE ORDER
// const pendingFinancedOrders_FromFANTOM_USDC =  await ExecutionOrdersEngineFromFantom_instance.get_pendingFinancedOrders_FromFANTOM_USDC();
// console.log(` =-----> pendingFinancedOrders_FromFANTOM_USDC: `,pendingFinancedOrders_FromFANTOM_USDC);
const executeOrder_Moonbeam_BuyWithUSDC = async (orderNonce) => {

	return new Promise (async (resolve,reject) => {

    console.log(`*********************  executeOrder_Moonbeam_BuyWithUSDC ExecutionOrdersEngineFromFantom_instance Start ***********************************`);

    const gasEstimate = await ExecutionOrdersEngineFromFantom_instance.estimateGas.executeOrder_Moonbeam_BuyWithUSDC( orderNonce ); 
    const gasPremium = gasEstimate.mul(130).div(100);
    console.log(`executeOrder_Moonbeam_BuyWithUSDC => gasEstimate: ${gasEstimate} gasPremium: ${gasPremium} orderNonce: ${orderNonce}`);

    const tx =  await ExecutionOrdersEngineFromFantom_instance.executeOrder_Moonbeam_BuyWithUSDC(orderNonce);
 
    try {
      const receipt = await tx.wait();
      if (receipt.status === false) {
        throw new Error(`Transaction executeOrder_Moonbeam_BuyWithUSDC with orderNonce: ${orderNonce} failed`);
      }

      console.log(` executeOrder_Moonbeam_BuyWithUSDC orderNonce: ${orderNonce} has been mined`);
      resolve({msg: `  ===---> executeOrder_Moonbeam_BuyWithUSDC has updated successfuly at orderNonce: ${orderNonce} ${new Date()}`, code:1, error:""});

    }
    catch (er) {
        console.log(`executeOrder_Moonbeam_BuyWithUSDC ERROR MESSAGE er: `,er);
        resolve({msg: `  ===---> executeOrder_Moonbeam_BuyWithUSDC has E R R O R E D at orderNonce: ${orderNonce} ${new Date()}`, code:1, error: er});
    };

  });

}






const executeORDERSMoonbeam_FromFatnomNONUSDC = async () => {
	return new Promise (async (resolve,reject) => {
      console.log(`*********************  executeORDERSMoonbeam_FromFatnomNONUSDC Start ***********************************`);
      const message = await execute_OrdersFromFantom_NONUSDC();
      console.log(`*********************  executeORDERSMoonbeam_FromFatnomNONUSDC End *********************************** message: `,message);
      resolve({msg: ` => executeORDERSMoonbeam_FromFatnomNONUSDC has updated successfuly at ${new Date()}`, code:1, error:""});
  });

}

const execute_OrdersFromFantom_NONUSDC = async () => {
	return new Promise (async (resolve,reject) => {

    const pendingOrders_FromFANTOM_NON_USDC =  await ExecutionOrdersEngineFromFantom_instance.get_pendingOrders_FromFANTOM_NON_USDC();
    console.log(` =-----> pendingOrders_FromFANTOM_NON_USDC: `,pendingOrders_FromFANTOM_NON_USDC);
      
    if (pendingOrders_FromFANTOM_NON_USDC.length>0)
    {
      const orderNonce = pendingOrders_FromFANTOM_NON_USDC[0];
      console.log(`*** execute_OrdersFromFantom_NONUSDC Will execute Moonbeam Order from Fatnom with nonce: ${orderNonce}`);
      try {
        const message = await executeOrder_Moonbeam_NONUSDC(orderNonce);
        console.log(`execute_OrdersFromFantom_NONUSDC MESSAGE 400 message: `,message);

        await execute_OrdersFromFantom_NONUSDC();
      }
      catch (someError) 
      {
        console.log(chalk.bgRed(`execute_OrdersFromFantom_NONUSDC ERROR MESSAGE 5000 someError: `,someError));
      }
    }
    console.log(`End of execute_OrdersFromFantom_NONUSDC`);
    resolve(" 000 execute_OrdersFromFantom_NONUSDC has finished 000");

  });

}  

// THIS TELLS YOU IF THERE ARE ANY ORDERS READY TO BE EXECUTED FROM TOKEN TO USDC TO => READ NONCE THEN CALL FUNCTION BELOW TO EXECUTE ORDER
// const pendingOrders_FromFANTOM_NON_USDC =  await ExecutionOrdersEngineFromFantom_instance.get_pendingOrders_FromFANTOM_NON_USDC();
// console.log(` =-----> pendingOrders_FromFANTOM_NON_USDC: `,pendingOrders_FromFANTOM_NON_USDC);
const executeOrder_Moonbeam_NONUSDC = async (orderNonce) => {

	return new Promise (async (resolve,reject) => {

    console.log(`*********************  executeOrder_Moonbeam_NONUSDC ExecutionOrdersEngineFromFantom_instance Start ***********************************`);

    const gasEstimate = await ExecutionOrdersEngineFromFantom_instance.estimateGas.executeOrder_Moonbeam_NONUSDC( orderNonce, {value: ethers.utils.parseEther("1.5")} ); 
    const gasPremium = gasEstimate.mul(130).div(100);
    console.log(`executeOrder_Moonbeam_NONUSDC => gasEstimate: ${gasEstimate} gasPremium: ${gasPremium} orderNonce: ${orderNonce}`);

    const tx =  await ExecutionOrdersEngineFromFantom_instance.executeOrder_Moonbeam_NONUSDC(orderNonce, {value: ethers.utils.parseEther("1.5")} );


    try {
      const receipt = await tx.wait();
      if (receipt.status === false) {
        throw new Error(`Transaction executeOrder_Moonbeam_NONUSDC with orderNonce: ${orderNonce} failed`);
      }

      console.log(` executeOrder_Moonbeam_NONUSDC orderNonce: ${orderNonce} has been mined`);
      resolve({msg: `  ===---> executeOrder_Moonbeam_NONUSDC has updated successfuly at orderNonce: ${orderNonce} ${new Date()}`, code:1, error:""});

    }
    catch (er) {
        console.log(`executeOrder_Moonbeam_NONUSDC ERROR MESSAGE er: `,er);
        resolve({msg: `  ===---> executeOrder_Moonbeam_NONUSDC has E R R O R E D at orderNonce: ${orderNonce} ${new Date()}`, code:1, error: er});
    };

  });

}









//MOONBEAM
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
          resolve({msg: `  ===---> execute_Order_Moonbeam has E R R O R E D at orderNonce: ${orderNonce} ${new Date()}`, code:1, error: er});
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
      let accountNonce_Moonbeam = await Moonbeam_provider.getTransactionCount(process.env.ACCOUNT_3000_PUBLIC_KEY);
      let accountNonce_Fantom   = await Fantom_provider.getTransactionCount(process.env.ACCOUNT_3000_PUBLIC_KEY);
      const balances = await getServerAccountBalances();
      console.log(chalk.cyan(`${new Date()} Starting Inpections at: ${blockNum} SERVER ACCOUNT BALANCES: ${balances.GLMR_balance} GLMR  ${balances.FTM_balance} FTM  accountNonce: ${accountNonce_Moonbeam} Moonbeam  ${accountNonce_Fantom} Fantom`)); 


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

      console.log(` `);
      console.log(` `);

      
      //NEW 
      //AXELAR FANTOM SATELITE
      console.log(` 1 &&&&&&&&&&&&&&&&&&&&&&&&& `);
      const message_requestOrderAXLUSDCfinancing = await requestOrderAXLUSDCfinancing();
      if (message_requestOrderAXLUSDCfinancing.code===1) console.log("100 ",message_requestOrderAXLUSDCfinancing.msg);
      else console.log(chalk.bgRed(message_requestOrderAXLUSDCfinancing.msg," ",message_requestOrderAXLUSDCfinancing.error)); 

      console.log(` 2 &&&&&&&&&&&&&&&&&&&&&&&&& `);
      const message_financeOrdersTo_Execute = await financeOrdersTo_Execute();
      if (message_financeOrdersTo_Execute.code===1) console.log("101",message_financeOrdersTo_Execute.msg);
      else console.log(chalk.bgRed(message_financeOrdersTo_Execute.msg," ",message_financeOrdersTo_Execute.error)); 

      console.log(` 3 &&&&&&&&&&&&&&&&&&&&&&&&& `);
      const message_financeOrdersTo_Delete = await financeOrdersTo_Delete();
      if (message_financeOrdersTo_Delete.code===1) console.log("102",message_financeOrdersTo_Delete.msg);
      else console.log(chalk.bgRed(message_financeOrdersTo_Delete.msg," ",message_financeOrdersTo_Delete.error)); 

      //ExecutionOrdersEngineFromFantom
      console.log(` 4 &&&&&&&&&&&&&&&&&&&&&&&&& `);
      const message_requestPendingOrdersFinancing = await requestPendingOrdersFinancing();
      if (message_requestPendingOrdersFinancing.code===1) console.log("200 ",message_requestPendingOrdersFinancing.msg);
      else console.log(chalk.bgRed(message_requestPendingOrdersFinancing.msg," ",message_requestPendingOrdersFinancing.error)); 

      console.log(` 5 &&&&&&&&&&&&&&&&&&&&&&&&& `);
      const message_delete_Unfinanced_Orders = await delete_Unfinanced_Orders();
      if (message_delete_Unfinanced_Orders.code===1) console.log("201 ",message_delete_Unfinanced_Orders.msg);
      else console.log(chalk.bgRed(message_delete_Unfinanced_Orders.msg," ",message_delete_Unfinanced_Orders.error)); 
      
      
      
      console.log(` 6 &&&&&&&&&&&&&&&&&&&&&&&&& `);
      const message_executeORDERSMoonbeam_FromFatnomNONUSDC = await executeORDERSMoonbeam_FromFatnomNONUSDC();
      if (message_executeORDERSMoonbeam_FromFatnomNONUSDC.code===1) console.log("204 ",message_executeORDERSMoonbeam_FromFatnomNONUSDC.msg);
      else console.log(chalk.bgRed(message_executeORDERSMoonbeam_FromFatnomNONUSDC.msg," ",message_executeORDERSMoonbeam_FromFatnomNONUSDC.error)); 

      
      console.log(` 7 &&&&&&&&&&&&&&&&&&&&&&&&& `);
      const message_executeORDERSMoonbeam_FromFatnomWithUSDC = await executeORDERSMoonbeam_FromFatnomWithUSDC();
      if (message_executeORDERSMoonbeam_FromFatnomWithUSDC.code===1) console.log("202 ",message_executeORDERSMoonbeam_FromFatnomWithUSDC.msg);
      else console.log(chalk.bgRed(message_executeORDERSMoonbeam_FromFatnomWithUSDC.msg," ",message_executeORDERSMoonbeam_FromFatnomWithUSDC.error)); 



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
