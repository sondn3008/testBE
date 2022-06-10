import autoBind from "auto-bind";
import { createValidate, loginValidate} from "./UserFactory";
import BaseService from "../../../../base/BaseService";
import UserRepository from "../../../infrastructure/account/user/UserRepository";
import { validPassword, hashPassword, makeCode } from "../../../../helper/Utility";
import {createJWT} from "../../../auth/auth.services"

const userRepository = new UserRepository();

class UserService extends BaseService {
    constructor() {
        super(userRepository);
        autoBind(this);
    }

    async createUser(data) {
        const response = {
            json: null,
            statusCode: null,
        };

        // Validate data and create object
        const newUser = await createValidate(data);
        if (newUser.error) {
            response.statusCode = 400;
            response.json = {
                message: newUser.Message,
            };
            return response;
        }

        // Check Email Exist
        const checkEmailResult = await userRepository.findOneByEmail(data.email);

        if (checkEmailResult.isSuccess) {
            response.statusCode = 400;
            response.json = {
                success: false,
                message: "Email has already registered",
            };
            return response;
        }

        // HashPassword
        newUser.info.password = await hashPassword(newUser.info.password);

        // Create new user
        const result = await userRepository.create(newUser.info);
        console.log(result)
        if (!result.isSuccess) {
            response.statusCode = 500;
            response.json = {
                message: result.message,
            };
            return response;
        }

        response.statusCode = 200
        response.json = result;
        return response;
    }

    async loginUser(data) {
        const response = {
            json: null,
            statusCode: null,
        };

        // Validate data and create object
        const newUser = await loginValidate(data);
        if (newUser.error) {
            response.statusCode = 400;
            response.json = {
                message: newUser.Message,
            };
            return response;
        }

        // Check Email Exist
        const checkEmailResult = await userRepository.findOneByEmail(data.email);

        if (!checkEmailResult.isSuccess) {
            response.statusCode = 400;
            response.json = {
                success: false,
                message: "Email or password is incorrect",
            };
            return response;
        }

        // Check Password
        const check = await validPassword(data.password, checkEmailResult.data.password);
        if (!check) {
            response.statusCode = 400;
            response.json = {
                success: false,
                message: "Email or password is incorrect",
            };
            return response;
        }
                //JWT
        const token = await createJWT({ id: checkEmailResult.data.id });

        response.statusCode = 200;

        let user = checkEmailResult.data
        delete user.password

        response.json = {
            success: true,
            user: user,
            accessToken: token,
        }
        return response;
    }

    // get all user 
    async getAll(page) {
        const response = {
            json: null,
            statusCode: null,
        };

        const offset = parseInt(process.env.PAGE_LIMIT) * page
        const result = await userRepository.findAll(offset, parseInt(process.env.PAGE_LIMIT));
        if (!result) {
            response.statusCode = 500;
            response.json = {
                message: result.message,
            };
            return response;
        }

        response.statusCode = 200;
        response.json = result;
        return response;
    }
}

export default new UserService();