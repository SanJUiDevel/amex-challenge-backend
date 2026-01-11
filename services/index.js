const fastify = require('fastify')({ logger: true });
const listenMock = require('../mock-server');
const CircuitBreaker = require('../utils/circuit-breaker');
const { logger } = require('../utils/logger');

const addEventCircuitBreaker = new CircuitBreaker();

fastify.get('/getUsers', async (request, reply) => {
    try {
        const resp = await fetch('http://event.com/getUsers');
        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }
        const data = await resp.json();
        reply.send(data);
    } catch (error) {
        logger.error('Failed to fetch users', error.message);
        reply.status(500).send({ error: 'Failed to fetch users' });
    }
});

fastify.post('/addEvent', async (request, reply) => {
    try {
        const result = await addEventCircuitBreaker.call(async () => {
            const resp = await fetch('http://event.com/addEvent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: new Date().getTime(),
                    ...request.body
                })
            });
            
            if (!resp.ok) {
                throw new Error(`External service error: ${resp.status}`);
            }
            
            return await resp.json();
        });
        
        reply.send(result);
    } catch (error) {
        if (error.message === 'Circuit breaker is OPEN') {
            logger.warn('Circuit breaker is open, service temporarily unavailable');
            reply.status(503).send({
                error: 'Service temporarily unavailable',
                message: 'External event service is experiencing issues. Please try again later.'
            });
        } else {
            logger.error('Failed to add event', error.message);
            reply.status(500).send({ error: 'Failed to add event' });
        }
    }
});

fastify.get('/getEvents', async (request, reply) => {
    try {
        const resp = await fetch('http://event.com/getEvents');
        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }
        const data = await resp.json();
        reply.send(data);
    } catch (error) {
        logger.error('Failed to fetch events', error.message);
        reply.status(500).send({ error: 'Failed to fetch events' });
    }
});

fastify.get('/getEventsByUserId/:id', async (request, reply) => {
    try {
        const { id } = request.params;
        const user = await fetch('http://event.com/getUserById/' + id);
        if (!user.ok) {
            throw new Error(`User not found: ${id}`);
        }
        const userData = await user.json();
        
        if (!userData || !userData.events) {
            reply.send([]);
            return;
        }
        
        const userEvents = userData.events;
        const eventPromises = userEvents.map(eventId => 
            fetch('http://event.com/getEventById/' + eventId).then(res => {
                if (!res.ok) throw new Error(`Event not found: ${eventId}`);
                return res.json();
            })
        );
        
        const eventArray = await Promise.all(eventPromises);
        reply.send(eventArray);
    } catch (error) {
        logger.error(`Failed to fetch events for user ${request.params.id}`, error.message);
        reply.status(500).send({ error: 'Failed to fetch user events' });
    }
});

fastify.listen({ port: 3000 }, (err) => {
    listenMock();
    if (err) {
      fastify.log.error(err);
      process.exit();
    }
});
