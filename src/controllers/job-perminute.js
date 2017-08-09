

const _ = require('underscore');
const request = require('request');
const mongoose = require('mongoose');

const Category = require('../models/category');
const Class = require('../models/class');
const Member = require('../models/member');
const Messenger = require('../models/messenger');
const Notification = require('../models/notification');
const Profile = require('../models/profile');
const LogMotivation = require('../models/motivationlog');
const Quote = require('../models/quote');
const Scheduled = require('../models/scheduled');
const Tagterm = require('../models/tagterm');
const SendText = require('../models/text');
const User = require('../models/user');
const UserProfile = require('../models/userprofile');


const constant = require('../constant');
const async = require('async');
const Immutable = require('immutable');
const ObjectId = mongoose.Types.ObjectId;
const nodeschedule = require('node-schedule');
const moment = require('moment');
const access_token = constant.FACEBOOK_TOKEN
const requestUrl = `https://graph.facebook.com/v2.9/me/messages?access_token=${access_token}`;

var paramObject = {};


var perminuterule = new nodeschedule.RecurrenceRule();
perminuterule.second = 00;
// DEFAULT MOTIVATION 



var perminuterule = new nodeschedule.RecurrenceRule();
perminuterule.second = 00;
// DEFAULT MOTIVATION 
var m = nodeschedule.scheduleJob(perminuterule, function () {
    var predicate = {};
    predicate.isdefault = true;
    var utcMoment = moment.utc();
    var scheduletime = utcMoment.format('HH:mm');
    predicate.scheduletime = scheduletime;
    Scheduled.find(predicate)
        // todo: add sorting by current date
        .populate({ path: 'memberid', select: '_id memberid categories profiletype gender name currentsequence' })
        .exec()
        .then(data => {
            console.log(data.length + " schedule found");
            data.forEach(memberDetails => {
                LogicPerMember(memberDetails);
            })
        }).catch(err => {
            throw err;
        });
});

async function LogicPerMember(memberDetails) {
    try {
        paramObject = {};
        paramObject.name = memberDetails.name;
        paramObject._id = memberDetails._id;
        paramObject.memberid = memberDetails.memberid;
        paramObject.profiletype = memberDetails.profiletype;
        paramObject.gender = memberDetails.gender;
        paramObject.currentsequence = memberDetails.currentsequence;
        await getCategorycontent(memberDetails.categories);
        await getUserProfile();
        await getText();
        await getTagTerm();
        await getcontenttype();
        await bingsearch();
        await fbsendtext();
        await fbsendattachment();
        await updatesequence();
        await createlog();
    } catch (error) {
        throw error;
    }
}

var getCategorycontent = (categories) => {
    var randomed = randomarray(categories);
    return Category.findById(randomed).
        then(data => {
            //name vid content
            paramObject.vidcontent = randomarray(data.vidcontent);
            paramObject.imagecontent = randomarray(data.content);
        }).catch(err => {
            throw err;
        });
};

var getUserProfile = () => {
    return UserProfile.find({ memberid: paramObject._id, delivery: { $ne: 0 } })
        .then(userprofile => {
            var oneprofile;
            //need muna matapos ung if else
            if (userprofile.length > 0) {
                oneprofile = randomarray(userprofile);
                getoneprofile(oneprofile);
            }
            else {
                UserProfile.remove({ memberid: paramObject._id });
                Profile.find({ profile: paramObject.profiletype, delivery: { $ne: "0" } })
                    .then(data => {
                        var tosaveuserprofile = [];
                        data.map((item, index) => {
                            tosaveuserprofile.push({
                                memberid: member._id,
                                variable: item.variable,
                                tag: item.tag,
                                delivery: item.delivery
                            })
                        });
                        UserProfile.insertMany(tosaveuserprofile)
                            .then(userprofile => {
                                oneprofile = randomarray(userprofile);
                                getoneprofile(oneprofile);
                            }).catch(err => { throw err });
                    })
            }

        }).catch(err => { throw err });
};

var getoneprofile = (oneprofile) => {
    return UserProfile.findOneAndUpdate({ memberid: oneprofile.memberid, variable: oneprofile.variable, tag: oneprofile.tag },
        { $inc: { delivery: -1 } })
        .then(userprofile => {
            paramObject.variable = oneprofile.variable;
            paramObject.tag = oneprofile.tag;
        }).catch(err => { throw err });
}


var getText = () => {
    return SendText.find({ tag: paramObject.tag, variable: paramObject.variable })
        .then(data => {
            var text = randomarray(data.text)
            var textarray = [
                paramObject.name + ", " + text,
                text,
                text + " " + paramObject.name + "."
            ]
            paramObject.text = randomarray(textarray);
        }).catch(err => { throw err });
}

var getTagTerm = () => {
    return Tagterm.findOne({ tag: paramObject.tag })
        .then(data => {
            paramObject.tagterm = randomarray(data.terms)
        }).catch(err => { throw err });
}

var getcontenttype = () => {
    var seq = paramObject.currentsequence;
    if (seq == 1) {
        paramObject.contenttype = "images"
        paramObject.searchquery = paramObject.imagecontent + " motivation -god -government -religion -politics"
    }
    else if (seq >= 2 && seq <= 5) {
        paramObject.contenttype = "images"
        paramObject.searchquery = paramObject.tagterm + " motivational quote -god -government -religion -politics"
    }
    else {
        paramObject.contenttype = "videos"
        paramObject.searchquery = paramObject.vidcontent + " -god -government -religion -politics"
    }
    return;
}

var bingsearch = () => {
    var options = {
        method: 'GET',
        json: true,
        headers: { "Content-Type": "application/json", "Ocp-Apim-Subscription-Key": constant.BING_COGNITIVE_KEYv5 },
        url: `https://api.cognitive.microsoft.com/bing/${constant.BING_COGNITIVE_VERSION}/${paramObject.contenttype}/search?q=${paramObject.searchquery}&responseFilter=${paramObject.contenttype}&safeSearch=Moderate&count=60`
    };
    //console.log(options);
    return request(options)
        .then(body => {
            searchresult = randomarray(body.value);
            paramObject.contentUrl = searchresult.contentUrl
            paramObject.title = searchresult.name
            paramObject.thumbnail = searchresult.thumbnailUrl
            paramObject.description = searchresult.description
        })
}


var fbsendtext = () => {
    var requestData = {
        recipient: {
            id: paramObject.memberid
        },
        message: {
            text: paramObject.text
        }
    }
    var options = {
        method: 'POST',
        body: requestData,
        url: requestUrl,
        json: true
    }
    // console.log(options);
    return request.post(options)
        .then(data => {
            updatemessenger(paramObject.text);
            return data;
        }).catch(err => { throw err })
}

var fbsendattachment = () => {
    var requestData = {
        recipient: {
            id: paramObject.memberid
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [
                        {
                            title: paramObject.title,
                            image_url: paramObject.thumbnail,
                            //subtitle: description,
                            default_action: {
                                type: "web_url",
                                url: paramObject.contentUrl,
                                webview_height_ratio: "tall",
                            }
                        }
                    ],
                }
            }
        },
        scrape: true

    }
    var options = {
        method: 'POST',
        body: requestData,
        url: requestUrl,
        json: true
    }
    // console.log(options);
    return request.post(options)
        .then(data => {
            updatemessenger("attachment:" + paramObject.contentUrl);
            return data;
        }).catch(err => { throw err });
}


var updatesequence = () => {
    currentsequence = currentsequence == 7 ? 1 : currentsequence + 1
    return Member.findOneAndUpdate({ memberid: memberid }, { currentsequence: currentsequence })
        .then(data => {
            return data;
        }).catch(err => { throw err })
}


var updatemessenger = (message) => {
    message_body = {
        message: message,
        message_type: "outbound"
    }
    return
    Messenger.findOneAndUpdate({ member_id: ObjectId(paramObject._id) },
        { $push: { message_body: message_body } })
        .then(data => {
            return data;
        }).catch(err => { throw err });
}


var createlog = () => {
    var logsparam = {
        memberid: paramObject._id,
        profiletype: paramObject.profiletype,
        url: paramObject.contentUrl,
        searchquery: paramObject.searchquery,
        contenttype: paramObject.contenttype,
        variable: paramObject.variable,
        tag: paramObject.tag,
        tagterm: paramObject.tagterm,
        pretext: paramObject.text
    }
    return LogMotivation.create(logsparam)
        .then(data => {
            return data;
        }).catch(err => { throw err });

}




function randomarray(randomarray) {
        try {
                var randomresult = randomarray[Math.floor(Math.random() * randomarray.length)]
                return randomresult;
        } catch (error) {
                console.log(randomarray);
        }

}