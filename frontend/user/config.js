const CONFIG = {
    API_BASE_URL: "https://7lam20eark.execute-api.us-east-1.amazonaws.com/dev",

    ENDPOINTS: {
        SIGNUP: "/user",
        LOGIN: "/login",
        PETS: "/pets"
    },

    COGNITO: {
        REGION: "us-east-1",
        USER_POOL_ID: "",
        CLIENT_ID: ""
    },

    S3_BUCKET: "petmatch-images-ccl"
};

window.CONFIG = CONFIG;