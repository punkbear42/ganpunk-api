const express = require('express')
const contracts = require('./external_contracts.js')
const fs = require('fs')
const { createImageData } = require('canvas')
const app = express()

PNG = require("pngjs").PNG;

const tf = require('@tensorflow/tfjs');
const { ethers } = require('ethers');
const { scalePixels } = require('./lib/scalePixels');

let model
let provider = new ethers.providers.StaticJsonRpcProvider('https://rinkeby.infura.io/v3/78040c38a1eb436a9ce429fa1746d16c')

const host = 'ganpunk.herokuapp.com'

app.use(express.json())

app.use('/punks', express.static('punks'));

app.use('/model', express.static('model'));

app.get('/', (req,res) => {
    res.status(200).json({})
})

app.get('/:id', async (req,res) => {
    // console.log(JSON.stringify(process.env))
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

    const resizeMultiplier = 12

    const fileName = 'punk' + req.params.id + '.png'
    const fileNameResized = 'punk' + req.params.id + '_' + resizeMultiplier + '.png'
    const metadata = {
        "name": "punk #" + req.params.id,
        "description": "description #" + req.params.id,
        "image": 'https://' + host + '/punks/' + fileNameResized,
        "external_url": 'https://punksgan.surge.sh/otherspunk?search=' + req.params.id
    }
    
    png.pack().pipe(fs.createWriteStream('./punks/' + fileName));
    const scale10ImageData = scalePixels(createImageData(Uint8ClampedArray.from(data), 24, 24), resizeMultiplier, { from: 1 })
    const pngResized = new PNG({ filterType: 4, width: scale10ImageData.width, height: scale10ImageData.height })
    pngResized.data = Buffer.from(scale10ImageData.data)
    const stream = fs.createWriteStream('./punks/' + fileNameResized)
    stream.on('finish', function(){
        res.status(200).json(metadata)    
    });
    pngResized.pack().pipe(stream);
    
    
})

app.listen(process.env.PORT || 8081, async () => {
    model = await tf.loadLayersModel('https://' + host + '/model/model.json')
    console.log("listening...")
})