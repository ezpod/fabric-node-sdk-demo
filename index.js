/*
  Fabric Node SDK Demo
  
  hubwiz.com 2015 ~ 2019

  crash tutorial: http://blog.hubwiz.com/2019/04/27/fabric-node-sdk-1.4-crash/
  detailed hands-on course: http://xc.hubwiz.com/course/5c95f916a8d86b7067ffebb8
*/
const Client = require('fabric-client')
const fs = require('fs')

async function init(){
  let client = new Client
  let channel = client.newChannel('ch1')
  
  let keyPem = fs.readFileSync('../solo-network/msp/keystore/user-key.pem','utf-8')
  let certPem = fs.readFileSync('../solo-network/msp/signcerts/user-cert.pem','utf-8')
  let user = await client.createUser({
    username: 'user',
    mspid: 'SampleOrg',
    cryptoContent: {
      privateKeyPEM: keyPem,
      signedCertPEM: certPem
    },
    skipPersistence: true
  })
  client.setUserContext(user,true)
    
  let peer = client.newPeer('grpc://127.0.0.1:7051',{})
  channel.addPeer(peer)
  
  let orderer = client.newOrderer('grpc://127.0.0.1:7050',{})
  channel.addOrderer(orderer)
  
  return {client,channel}
}

async function query(ctx,method){
  let args = Array.prototype.slice.call(arguments,2)
  let req = {
    chaincodeId: 'counter-cc',
    fcn: method,
    args: args
  }
  let ret = await ctx.channel.queryByChaincode(req)
  console.log('query: ', ret.toString())
}

async function invoke(ctx,method){
  let args = Array.prototype.slice.call(arguments,2)
  let req = {
    chaincodeId: 'counter-cc',
    fcn: method,
    args: args,
    txId: ctx.client.newTransactionID()
  }
  let rsp = await ctx.channel.sendTransactionProposal(req)
  let ret = await ctx.channel.sendTransaction({
    proposalResponses: rsp[0],
    proposal: rsp[1]
  })
  console.log('invoke: ', ret)
}

async function yield(duration=1000){
  return new Promise(resolve => setTimeout(resolve,duration))
}

async function main(){
  let ctx = await init()
  
  await query(ctx,'value')
  
  await invoke(ctx,'inc','2')
  await yield(3000)
 
  await query(ctx,'value')
}

main().catch(error => console.log(error))