var cron = require('node-cron');

module.exports = function() {
    cron.schedule('* * * * *', () => {
        console.log('running every minute');
    });

    cron.schedule('0 * * * *', () => {
        console.log('running every hour');
    });

    cron.schedule('0 0 * * *', () => {
        console.log('running every day at midnight');
    });

    cron.schedule('0 0 1 * *', () => {
        console.log('running every first of the month at midnight');
    });
}