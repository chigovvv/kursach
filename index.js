var express = require('express');
var bodyParser = require('body-parser');
const { exec } = require('child_process');

var app = express();

const urlencodedParser = bodyParser.urlencoded({extended: false});

let square = '';
let hot = '';
let cold = '';
let changed = '';
let cleaned = '';
let runned = '';


function cleanSh() {
    const script1 = exec('sh buoyantCavity/Clean.sh',
        (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        }
    );
    if (script1 == -1)
    {
        cleaned = 'Failed to clean files from previous solution';
        return cleaned;
    }
    else{
        cleaned = 'Files from previous solution are succesfully deleted';
        return cleaned;
    }
}

function changeParams(){
    const middle = Math.round((+hot + +cold)/2)
    const script = exec(`cd buoyantCavity/;
                        sed -1 "19s/hot .*/hot ${hot};/;20s/cold.*/cold ${cold}; /;22s/internalField 
                        uniform.*/internalField uniform ${middle};/" 0/T;
                        sed -1 "17s/b.*/b ${square};/" system/blockMeshDict; 
                        echo changed`,
    (error, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        if (error !== null) {
            console.log(`exec error: ${error}`);
        }   
    });
    if (script == -1) {
        changed = 'Не удалось внести изменения в файлы.';
        return changed;
    }
    else {
        changed = 'Файлы решения успешно изменены.';
        return changed;
    }
}

function runSh() {
    const script2 = exec(`cd buoyantCavity/; blockMesh;
                        foamRun >log; paraFoam;`, {maxBuffer: 1024 * 2000},
        (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });
        if (script2 == -1)
        {
            runned = 'Failed to run files from previous solution';
            return runned;
        }
        else{
            runned = 'The solver succesfully runned. Wait for solution finishing, paraView will open automaticly';
            return runned;
        }
}

app.use(express.static(__dirname));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/result', function (req, res) 
{
    res.json({changeParams: `${changed}`, Cleaned: `${cleaned}`, Run: `${runned}`});
})

app.get('/calc', (req, res) =>{
    res.sendFile(__dirname + '/calc.html')
})

app.post('/', urlencodedParser, function (req, res) {
    if(!req.body) return res.sendStatus(400);
    console.log(req.body);
    square = req.body.square;
    hot = req.body.hot;
    cold = req.body.cold;
    try{
        cleanSh();
        changeParams();
        runSh();
        res.status(200);
        res.redirect('/calc');
    }
    catch (error) {
        res.send('Failed to run calculation');
    }
});



app.listen(8000, function () {
    console.log('started at http://localhost:8000');
});



