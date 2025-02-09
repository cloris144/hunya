# HunyProof Frontend

This is the frontend of the HunyProof application, built using React. It includes authentication, file verification, and protected routes. The project is containerized using Docker for easy deployment.

## Table of Contents
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Docker Setup](#docker-setup)
- [File Structure](#file-structure)
- [Contributing](#contributing)
- [License](#license)

## Requirements

- Node.js (>=14.0.0)
- npm or yarn
- Docker & Docker Compose

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/hunyproof-frontend.git
   cd hunyproof-frontend
   ```

2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```

## Environment Variables

Create a `.env` file in the root directory and set the following environment variables:

```
REACT_APP_BACKEND_URL=http://127.0.0.1:8100
```

## Usage

To start the application in development mode:
```sh
npm start
```

The application will be available at `http://localhost:3000`.

## Docker Setup

To run the application using Docker:

1. Build the Docker image:
   ```sh
   docker build -t hunyproof-frontend .
   ```

2. Run the container:
   ```sh
   docker run -p 3000:3000 --name hunyproof-frontend -d hunyproof-frontend
   ```

Alternatively, you can use Docker Compose:
```sh
docker-compose up --build
```

## File Structure

```
├── src
│   ├── components
│   │   ├── UserMenu.jsx
│   │   ├── VerificationList.jsx
│   │   ├── VerificationDetails.jsx
│   │   ├── RenameDialog.jsx
│   ├── hooks
│   │   ├── useFileManager.jsx
│   ├── pages
│   │   ├── Login.jsx
│   ├── routes
│   │   ├── ProtectedRoute.jsx
│   ├── App.jsx
│   ├── index.jsx
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## Contributing

Pull requests are welcome! Please follow the coding standards and ensure all changes are tested before submitting.

## License

This project is licensed under the MIT License.

