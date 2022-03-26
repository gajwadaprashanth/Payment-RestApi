class transaction {
    constructor(rfid, from, to, location, timestamp, amount,status) {
           this.rfid=rfid;
           this.from=from;
           this.to=to;
           this.location=location;
           this.timestamp=timestamp;
           this.amount=amount;
           this.status=status;
    }
}

module.exports = transaction;