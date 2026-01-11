class CircuitBreaker {
    constructor() {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.nextAttempt = Date.now();
        this.timeout = 30000;
        this.threshold = 3;
        this.monitorWindow = 30000;
        this.failures = [];
    }

    async call(fn) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker is OPEN');
            }
            this.state = 'HALF_OPEN';
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        this.failures = [];
        if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
        }
    }

    onFailure() {
        const now = Date.now();
        this.failures.push(now);
        
        this.failures = this.failures.filter(time => now - time <= this.monitorWindow);
        
        if (this.failures.length >= this.threshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.timeout;
        }
    }

    getState() {
        return this.state;
    }
}

module.exports = CircuitBreaker;