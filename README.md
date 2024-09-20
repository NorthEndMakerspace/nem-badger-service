# NEM badger project

## Development
### Setup
Copy `.env.sample` into `.env` and put correct values in there

Add following line into `/etc/hosts`
```
127.0.0.1 nem.local
```

### Local development
Run local development API for easy app development:
```
docker-compose -p nem -f docker-compose.dev.yml up
```

Redis will run at port 6379.
`api.nem.local` will redirect to port 5001 (your local running dev server)

Prepare app dependencies 
```
npm install
```

Start local backend API dev server:
```
npm run start
```

Run backend server:
```
npm run start
```

### Running production build locally
Optionally rebuild backend package (if changed):
```
docker-compose -p nem -f docker-compose.local.yml build --no-cache backend
```
Launch:
```
docker-compose -p nem -f docker-compose.local.yml up
```
