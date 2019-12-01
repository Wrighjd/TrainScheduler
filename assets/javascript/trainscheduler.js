const config = {
    "apiKey"           : "AIzaSyDTZzRZokWqHyFnA0T11Hte9ZwJ9QgO4kI",
    "authDomain"       : "train-scheduler-3f682.firebaseapp.com",
    "databaseURL"      : "https://train-scheduler-3f682.firebaseio.com",
    "projectId"        : "train-scheduler-3f682",
    "storageBucket"    : "train-scheduler-3f682.appspot.com",
    "messagingSenderId": "886128771331"
};

firebase.initializeApp(config);

const database = firebase.database();



let trains = [], availableID = 0;
let myTrain, trainID, arrayID;



function loadDatabase() {
    // When the page loads, or when a user adds a train
    database.ref().on("child_added", function(snapshot) {
        
        const train = snapshot.val();

        
        trains.push(train);

        
        $("tbody").append(displayTrain(train));

        
        availableID = Math.max(train.id + 1, availableID);
    });

    
    database.ref().on("child_changed", function(snapshot) {
        
        const train = snapshot.val();
        trainID = train.id;
        
        
        findArrayID();
        trains[arrayID] = train;

        
        $(`tr#${trainID}`).replaceWith(displayTrain(train));
    });

    
    database.ref().on("child_removed", function(snapshot) {
        
        const train = snapshot.val();
        trainID = train.id;

        
        findArrayID();
        trains.splice(arrayID, 1);

        
        $(`tr#${trainID}`).remove();
    });
}



function findArrayID() {
   
    for (arrayID = 0; arrayID < trains.length; arrayID++) {
        if (trains[arrayID].id === trainID) {
            myTrain = trains[arrayID];

            break;
        }
    }
}

function findNextArrival(train) {
    
    const h0 = train.departure[1];
    const m0 = train.departure[2];
    const t0 = 60 * h0 + m0;

    
    const currentTime = new Date();

    const h1 = currentTime.getHours();
    const m1 = currentTime.getMinutes();
    const t1 = 60 * h1 + m1;

   
    const numTripsMade = Math.max(Math.floor((t1 - t0) / train.frequency), 0);
    
    
    const arrivalTime = t0 + (numTripsMade + 1) * train.frequency;
    
    let d = 0;
    let h = Math.floor(arrivalTime / 60);
    let m = arrivalTime - 60 * h;

    
    if (h >= 24) {
        d = Math.floor(h / 24);
        h = h % 24;
    }
    
    return {
        "nextArrival": [d, h, m],
        "minutesAway": arrivalTime - t1
    };
}



function displayTime(timeArray) {
    
    let d = timeArray[0];
    let h = timeArray[1];
    let m = timeArray[2];

    
    const period = (0 <= h && h < 12) ? "AM": "PM";

   
    h = h % 12;

    if (h === 0) {
        h = 12;
    }

   
    if (m < 10) {
        m = "0" + m;
    }

    
    if (d === 0) {
        return `${h}:${m} ${period}`

    } else if (d === 1) {
        return `${h}:${m} ${period}, in ${d} day`;

    } else {
        return `${h}:${m} ${period}, in ${d} days`;

    }
}

function displayTrain(train) {
    const info = findNextArrival(train);

    return `<tr id="${train.id}">
                <td>${train.name}</td>
                <td>${train.destination}</td>
                <td>${train.frequency}</td>
                <td>${displayTime(info.nextArrival)}</td>
                <td>${info.minutesAway}</td>
            </tr>`;
}

function refreshSchedule() {
    let output = "";

    trains.forEach(train => output += displayTrain(train));

    $("tbody").empty().append(output);
}



function switchMode(mode) {
    if (mode === "add") {
        
        $("input").val("");
        
       
        $("#search > h2").text("Add a Train");
        $("#button_add").css({"display": "block"});
        $("#button_delete, #button_edit").css({"display": "none"});

    } else if (mode === "edit") {
        
        const h = myTrain.departure[1];
        const m = myTrain.departure[2];

        let departure_string = (h < 10) ? `0${h}` : h;
        departure_string += (m < 10) ? `:0${m}` : `:${m}`;

        
        $("#name").val(myTrain.name);
        $("#destination").val(myTrain.destination);
        $("#departure").val(departure_string);
        $("#frequency").val(myTrain.frequency);

       
        $("#search > h2").text("Delete or Edit the Train");
        $("#button_add").css({"display": "none"});
        $("#button_delete, #button_edit").css({"display": "block"});

    }
}

function addTrain() {
    
    const departure_string = $("#departure").val().trim();

    
    [h, m] = departure_string.split(":").map(x => parseInt(x, 10));

   
    const train = {
        "id"         : availableID,
        "name"       : $("#name").val().trim(),
        "destination": $("#destination").val().trim(),
        "departure"  : [0, h, m],
        "frequency"  : parseInt($("#frequency").val().trim())
    };

    database.ref().child(availableID).set(train);

    
    $("input").val("");
}

function editTrain() {
    
    const departure_string = $("#departure").val().trim();

    
    [h, m] = departure_string.split(":").map(x => parseInt(x, 10));

    
    const train = {
        "id"         : trainID,
        "name"       : $("#name").val().trim(),
        "destination": $("#destination").val().trim(),
        "departure"  : [0, h, m],
        "frequency"  : parseInt($("#frequency").val().trim())
    };
    
    database.ref().child(trainID).update(train);

    
    switchMode("add");
}

function deleteTrain() {
    
    database.ref().child(trainID).remove();

   
    switchMode("add");
}



$(document).ready(function() {
    loadDatabase();

    
    const numSecondsLeft = 60 - (new Date()).getSeconds();

    setTimeout(function() {
        refreshSchedule();

        setInterval(refreshSchedule, 60000);

    }, 1000 * numSecondsLeft);

   
    $("#button_add").on("click", addTrain);
    $("#button_edit").on("click", editTrain);
    $("#button_delete").on("click", deleteTrain);
});


$("body").on("click", "tr", function() {
    trainID = parseInt($(this).attr("id"));

    findArrayID();
    
    switchMode("edit");
});