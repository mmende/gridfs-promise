"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var bson_1 = require("bson");
var fs = require("fs");
var mongodb_1 = require("mongodb");
var GridFSPromise = /** @class */ (function () {
    /**
     * Constructor
     * @param {string} mongoUrl
     * @param {string} databaseName
     * @param {MongoClientOptions} mongoOptions
     * @param {string} bucketName
     * @param {string} basePath
     */
    function GridFSPromise(mongoUrl, databaseName, mongoOptions, bucketName, basePath) {
        this.databaseName = databaseName;
        this.connectionUrl = mongoUrl;
        this.mongoClientOptions = mongoOptions;
        this.bucketName = bucketName || "fs";
        this.basePath = basePath || __dirname + "/../cache";
    }
    /**
     * Returns a stream of a file from the GridFS.
     * @param {string} id
     * @return {Promise<GridFSBucketReadStream>}
     */
    GridFSPromise.prototype.getFileStream = function (id) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connectDB().then(function (client) {
                var connection = client.db(_this.databaseName);
                var bucket = new mongodb_1.GridFSBucket(connection, { bucketName: _this.bucketName });
                bucket.find({ _id: new bson_1.ObjectID(id) }).toArray().then(function (result) {
                    if (result.length > 0) {
                        resolve(bucket.openDownloadStream(new bson_1.ObjectID(id)));
                    }
                    else {
                        reject();
                    }
                });
            }).catch(function (err) {
                reject(err);
            });
        });
    };
    /**
     * Save the File from the GridFs to the filesystem and get the Path back
     * @param {string} id
     * @param {string} fileName
     * @param {string} filePath
     * @return {Promise<string>}
     */
    GridFSPromise.prototype.getFile = function (id, fileName, filePath) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connectDB().then(function (client) {
                var connection = client.db(_this.databaseName);
                var bucket = new mongodb_1.GridFSBucket(connection, { bucketName: _this.bucketName });
                return bucket.find({ _id: new bson_1.ObjectID(id) }).toArray().then(function (result) {
                    if (!result) {
                        throw new Error("Object not found");
                    }
                    if (!fileName) {
                        fileName = result[0].filename;
                    }
                    if (!filePath) {
                        filePath = "";
                    }
                    if (_this.basePath.charAt(_this.basePath.length - 1) !== "/") {
                        filePath += "/";
                    }
                    if (!fs.existsSync("" + _this.basePath + filePath)) {
                        throw new Error("Path not found");
                    }
                    bucket.openDownloadStream(new bson_1.ObjectID(id))
                        .once("error", function (error) {
                        reject(error);
                    }).once("end", function () {
                        resolve("" + _this.basePath + filePath + fileName);
                    })
                        .pipe(fs.createWriteStream("" + _this.basePath + filePath + fileName));
                });
            }).catch(function (err) {
                reject(err);
            });
        });
    };
    /**
     * Get a single Object
     * @param {string} id
     * @return {Promise<IGridFSObject>}
     */
    GridFSPromise.prototype.getObject = function (id) {
        var _this = this;
        return new Promise((function (resolve, reject) {
            _this.connectDB().then(function (client) {
                var connection = client.db(_this.databaseName);
                var bucket = new mongodb_1.GridFSBucket(connection, { bucketName: _this.bucketName });
                bucket.find({ _id: new bson_1.ObjectID(id) }).toArray().then(function (result) {
                    if (result.length > 0) {
                        resolve(result[0]);
                    }
                    else {
                        reject(new Error("No Object found"));
                    }
                });
            }).catch(function (err) {
                reject(err);
            });
        }));
    };
    /**
     * Upload a file directly from a fs Path
     * @param {string} uploadFilePath
     * @param {string} targetFileName
     * @param {string} type
     * @param {object} meta
     * @param {boolean} deleteFile
     * @return {Promise<IGridFSObject>}
     */
    GridFSPromise.prototype.uploadFile = function (uploadFilePath, targetFileName, type, meta, deleteFile) {
        var _this = this;
        if (deleteFile === void 0) { deleteFile = true; }
        return new Promise(function (resolve, reject) {
            if (!fs.existsSync(uploadFilePath)) {
                reject(new Error("File not found"));
            }
            _this.connectDB().then(function (client) {
                var connection = client.db(_this.databaseName);
                var bucket = new mongodb_1.GridFSBucket(connection, { bucketName: _this.bucketName });
                fs.createReadStream(uploadFilePath)
                    .pipe(bucket.openUploadStream(targetFileName, {
                    contentType: type,
                    metadata: meta,
                }))
                    .on("error", function (err) {
                    if (fs.existsSync(uploadFilePath) && deleteFile === true) {
                        fs.unlinkSync(uploadFilePath);
                    }
                    reject(err);
                }).on("finish", function (item) {
                    if (fs.existsSync(uploadFilePath) && deleteFile === true) {
                        fs.unlinkSync(uploadFilePath);
                    }
                    resolve(item);
                });
            }).catch(function (err) {
                reject(err);
            });
        });
    };
    /**
     * Delete an File from the GridFS
     * @param {string} id
     * @return {Promise<boolean>}
     */
    GridFSPromise.prototype.delete = function (id) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.connectDB().then(function (client) {
                var connection = client.db(_this.databaseName);
                var bucket = new mongodb_1.GridFSBucket(connection, { bucketName: _this.bucketName });
                bucket.delete(new bson_1.ObjectID(id), (function (err) {
                    if (err) {
                        reject(err);
                    }
                    resolve(true);
                }));
            }).catch(function (err) {
                reject(err);
            });
        });
    };
    /**
     *
     * @return {PromiseLike<MongoClient> | Promise<MongoClient> | Thenable<MongoClient>}
     */
    GridFSPromise.prototype.connectDB = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, mongodb_1.MongoClient.connect(this.connectionUrl, this.mongoClientOptions)];
                    case 1: return [2 /*return*/, _a._CONNECTION = _b.sent()];
                }
            });
        });
    };
    Object.defineProperty(GridFSPromise.prototype, "connection", {
        get: function () {
            return this._CONNECTION;
        },
        enumerable: true,
        configurable: true
    });
    return GridFSPromise;
}());
exports.GridFSPromise = GridFSPromise;
//# sourceMappingURL=GridFSPromise.js.map