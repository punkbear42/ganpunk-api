const express = require('express')
const contracts = require('./external_contracts.js')
const fs = require('fs')
const app = express()
const sharp = require('sharp')

PNG = require("pngjs").PNG;

const tf = require('@tensorflow/tfjs');
const { ethers } = require('ethers');

let model
let provider = new ethers.providers.StaticJsonRpcProvider('https://rinkeby.infura.io/v3/78040c38a1eb436a9ce429fa1746d16c')

app.use(express.json())

app.use('/punks', express.static('punks'));

app.use('/model', express.static('model'));

app.get('/', (req,res) => {
    res.status(200).json({})
})

app.get('/:id', async (req,res) => {
    
    const gan_contract = contracts[4].contracts.GAN_PUNK
    // onsole.log(gan_contract)
    let contract = new ethers.Contract(gan_contract.address, gan_contract.abi, provider)
    console.log(req.params.id)
    let latentSpace = await contract.latentSpaceOf(parseInt(req.params.id))
    latentSpace = latentSpace.map((el) => parseFloat(el))

    const prediction = model.predict(tf.tensor([latentSpace]))
    const data = prediction.dataSync()

    for (var i = 0; i < data.length; i++) {                
        data[i] = ((data[i] + 1) / 2) * 255
    }
    const png = new PNG({ filterType: 4, width: 24, height: 24 })
    png.data = Buffer.from(Uint8ClampedArray.from(data))

    const fileNameOrg = 'punk' + req.params.id + '_org.png'
    const fileNameResized = 'punk' + req.params.id + '.png'
    const metadata = {
        "name": "punk #" + req.params.id,
        "description": "description #" + req.params.id,
        "image": 'https://7581-2a02-8109-86c0-6b18-4071-e479-9067-cf5f.ngrok.io/punks/' + fileNameResized,
        "network": 'Rinkeby'
    }
    
    png.pack().pipe(fs.createWriteStream('./punks/' + fileNameOrg));
    setTimeout(() => {
        sharp('./punks/' + fileNameOrg).resize({ height:336, width:336}).toFile('./punks/' + fileNameResized)
    }, 2000)    

    res.status(200).json(metadata)
})

app.listen(8081, async () => {
    model = await tf.loadLayersModel('http://localhost:8081/model/model.json')
    console.log("listening...")
})