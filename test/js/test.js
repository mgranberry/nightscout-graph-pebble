/* jshint node: true */
/* globals describe, it */
"use strict";

var fs = require('fs');

var expect = require('expect.js'),
  timekeeper = require('timekeeper');

var Data = require('../../src/js/data.js').Data;

var defaultConstants = JSON.parse(fs.readFileSync('../../src/js/constants.json', 'utf8'));
var config = {};

function mockAPI(data, urlToData) {
  data.getJSON = function(url, callback) {
    Object.keys(urlToData).forEach(function(key) {
      if (url.indexOf(key) !== -1) {
        callback(null, urlToData[key]);
      }
    });
  };
}

describe('getCurrentBasal', function() {

  var PROFILE = [{
    "created_at" : "2015-10-22T17:58-0700",
    "startDate" : "2015-10-22T17:57-0700",
    "timezone" : "America/Los_Angeles",
    "basal" : [
      {
        "time" : "00:00",
        "value" : "0.45",
      },
      {
        "time" : "08:00",
        "value" : "0.65",
      },
      {
        "time" : "18:00",
        "value" : "0.55",
      }
    ]
  }];

  function TREATMENTS(timestamp) {
    return [{
      "raw_rate": {
        "_type": "TempBasal",
        "temp": "absolute",
        "_description": "TempBasal 2015-12-03T14:12:25 head[2], body[1] op[0x33]",
        "timestamp": timestamp,
        "_body": "00",
        "_head": "3300",
        "rate": 0,
        "_date": "d90c0e430f"
      },
      "raw_duration": {
        "_type": "TempBasalDuration",
        "_description": "TempBasalDuration 2015-12-03T14:12:25 head[2], body[0] op[0x16]",
        "timestamp": timestamp,
        "_body": "",
        "_head": "1601",
        "duration (min)": 30,
        "_date": "d90c0e430f"
      },
      "created_at": "2015-12-03T14:12:25-08:00",
      "enteredBy": "openaps://medtronic/522",
      "rate": 0,
      "eventType": "Temp Basal",
      "timestamp": timestamp,
      "duration": "30",
      "medtronic": "mm://openaps/mm-format-ns-treatments/Temp Basal",
      "absolute": "0"
    }];
  }

  function mockBasals(data, tempBasalTimestamp) {
    mockAPI(data, {
      'profile.json': PROFILE,
      'treatments.json': TREATMENTS(tempBasalTimestamp),
    });
  }

  it('should report a temp basal with the difference from current basal and recency', function(done) {
    var d = Data(defaultConstants);
    mockBasals(d, "2015-12-03T14:12:25-08:00");
    timekeeper.freeze(new Date("2015-12-03T14:20:25-08:00"));

    d.getCurrentBasal(config, function(err, basal) {
      expect(basal).to.be('0u/h -0.65 (8)');
      done();
    });
  });

  it('should compute recency correctly', function(done) {
    var d = Data(defaultConstants);
    mockBasals(d, "2015-12-03T14:12:25-08:00");
    timekeeper.freeze(new Date("2015-12-03T14:28:25-08:00"));

    d.getCurrentBasal(config, function(err, basal) {
      expect(basal).to.be('0u/h -0.65 (16)');
      done();
    });
  });

  it('should report the profile basal rate if it is past the duration of the most recent temp basal', function(done) {
    var d = Data(defaultConstants);
    mockBasals(d, "2015-12-03T14:12:25-08:00");
    timekeeper.freeze(new Date("2015-12-03T14:50:25-08:00"));

    d.getCurrentBasal(config, function(err, basal) {
      expect(basal).to.be('0.65u/h');
      done();
    });
  });

  it('should report the correct profile basal rate at any time', function(done) {
    var d = Data(defaultConstants);
    mockBasals(d, "2015-12-03T14:12:25-08:00");
    timekeeper.freeze(new Date("2015-12-03T20:50:25-08:00"));

    d.getCurrentBasal(config, function(err, basal) {
      expect(basal).to.be('0.55u/h');
      done();
    });
  });
});

describe('getRigBatteryLevel', function() {
  var DEVICE_STATUS = [{
    "uploaderBattery": 37,
    "created_at": "2015-12-04T01:05:18.994Z"
  }];

  it('should report the rig battery level if it is recent enough', function(done) {
    var constants = {DEVICE_STATUS_RECENCY_THRESHOLD_SECONDS: 1800};
    var d = Data(constants);
    mockAPI(d, {'devicestatus.json': DEVICE_STATUS});
    timekeeper.freeze(new Date("2015-12-04T01:25:18.994Z"));

    d.getRigBatteryLevel(config, function(err, battery) {
      expect(battery).to.be('Rig 37%');
      done();
    });
  });

  it('should not report the rig battery level if it is stale', function(done) {
    var constants = {DEVICE_STATUS_RECENCY_THRESHOLD_SECONDS: 60};
    var d = Data(constants);
    mockAPI(d, {'devicestatus.json': DEVICE_STATUS});
    timekeeper.freeze(new Date("2015-12-04T01:25:18.994Z"));

    d.getRigBatteryLevel(config, function(err, battery) {
      expect(battery).to.be('-');
      done();
    });
  });
});

describe('getRawData', function() {
  function SGVS(lastNoise) {
    return [
      {
        "date" : 1449535203000,
        "dateString" : "2015-12-08T00:40:03+00:00",
        "direction" : "FortyFiveDown",
        "filtered" : 180352,
        "noise" : lastNoise,
        "sgv" : 146,
        "type" : "sgv",
        "unfiltered" : 172672
      },
      {
        "date" : 1449534904000,
        "dateString" : "2015-12-08T00:35:04+00:00",
        "direction" : "FortyFiveDown",
        "filtered" : 186240,
        "noise" : 1,
        "sgv" : 153,
        "type" : "sgv",
        "unfiltered" : 178528
      }
    ];
  }

  var CAL = [{
    "date" : 1449309612000,
    "dateString" : "2015-12-05T10:00:12+00:00",
    "intercept" : 27370.3970783194,
    "scale" : 1,
    "slope" : 786.670463685642,
    "type" : "cal"
  }];

  it('should report raw sgvs in ascending date order, plus sensor noise on most recent sgv', function(done) {
    var d = Data(defaultConstants);
    mockAPI(d, {
      'sgv.json': SGVS(1),
      'cal.json': CAL,
    });

    d.getRawData(config, function(err, raw) {
      expect(raw).to.be('Cln 146 139');
      done();
    });
  });

  it('should report raw sgvs in mmol when that preference is set, plus sensor noise on most recent sgv', function(done) {
    var d = Data(defaultConstants);
    mockAPI(d, {
      'sgv.json': SGVS(2),
      'cal.json': CAL,
    });

    var config = {mmol: true};
    d.getRawData(config, function(err, raw) {
      expect(raw).to.be('Lgt 8.1 7.7');
      done();
    });
  });
});
