
const express = require('express');
const mongoose = require('mongoose');
var bodyParser = require('body-parser');

mongoose.connect('mongodb://localhost/training-app-db')
.then(()=>console.log('Connected to database'))
.catch(err => console.error('Could not connect to database',err));

const app = express();

var jsonParser = bodyParser.json();

const trainingSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: 3,
        maxlength: 10,
        match: /^[a-z]+[a-z0-9]+$/i
    },
    trainingCapacity: {
        type: Number,
        min: 2,
        max: 30,
        required: true
    },
    availableSeats: {
        type: Number,
        min: 0,
        validate: {
            validator: function (value) {
                return this.trainingCapacity >= value;
            },
            message: 'Maximum value is the value of training capacity.'
        }
    },
    startDate: Date,
    endDate: {
        type: Date,
        min: function(){return this.startDate;}
    },
    isClosedForRegistration: {
        type: Boolean,
        default: false
    }

});

const Training = mongoose.model('Training',trainingSchema);


// async function createTraining(){
//     const training = new Training({
//         name: "Train2022",
//         trainingCapacity: 3,
//         availableSeats: 2,
//         startDate: new Date("2022-03-20"),
//         endDate: new Date("2022-03-22"),
//         isClosedForRegistration: true
//     });

//     try{
//         const result = await training.save();
//         console.log(result);
//     }
//     catch(ex){
//         console.log(ex.message);
//     }
    
// }


// createTraining();


app.get('/trainings', async (req, res)=>{
    const query = req.query;
    
    if(query.to && query.from){
        const from = new Date(query.from);
        const to = new Date(query.to);

        if(from == "Invalid Date" || to == "Invalid Date"){
            res.status(400).send('To and/or from not valid. The valid format is: yyyy-MM-ddTHH:mm:ss.');
            return;
        }

        const trainings = await Training.find({startDate: {$gte: from}, endDate: {$lte: to}});
        res.status(200).send(trainings);
        return;
    }

    const trainings = await Training.find();
    res.status(200).send(trainings);

});

app.get('/trainings/:id', async (req, res)=>{
    if(mongoose.Types.ObjectId.isValid(req.params.id)){
        const training = await Training.findById(req.params.id);
        if(!training){
            res.status(404).send(`The training with id ${req.params.id} was not found.`);
            return;
        }
        res.status(200).send(training);
        return;
    }
    res.status(404).send(`The training with id ${req.params.id} was not found.`);
    
});

app.post('/trainings/:id',jsonParser, async (req, res)=>{
    if(mongoose.Types.ObjectId.isValid(req.params.id)){
        const training = new Training(req.body);
        training._id= req.params.id;
        const error = training.validateSync();
        if(error){
            return res.status(400).send(`Training is not valid.`);
        }

        const training2 = await Training.findByIdAndUpdate(req.params.id, req.body,{
            new: true
        });

        if(!training2) return res.status(404).send(`The training with id ${req.params.id} was not found.`);
        return res.status(200).send(training2);
    }
    return res.status(404).send(`The training with id ${req.params.id} was not found.`);
});

app.delete('/trainings/:id',async (req, res)=>{
    if(mongoose.Types.ObjectId.isValid(req.params.id)){
        const training = await Training.findByIdAndRemove(req.params.id);
        if(!training)
            return res.status(404).send(`The training with id ${req.params.id} was not found.`);
        return res.status(200).send(training);
    }
    return res.status(404).send(`The training with id ${req.params.id} was not found.`);
});


const port = process.env.PORT || 5000;
app.listen(port, ()=> console.log(`Listening on port ${port}...`));