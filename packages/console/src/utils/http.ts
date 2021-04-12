import axios, { AxiosBasicCredentials, AxiosInstance, AxiosRequestConfig } from "axios"
import { ClassConstructor } from "class-transformer/types/interfaces"
import { plainToClass } from "class-transformer"

/**
 * A Wrapper around axios that transforms response body into specified class.
 */
export class Http {

    private readonly axiosInstance: AxiosInstance

    constructor(baseURL: string) {
        this.axiosInstance = axios.create({ baseURL })
    }

    public get<T>(url: string, cls: ClassConstructor<T>, auth: AxiosBasicCredentials): Promise<T | void> {
        return this.sendRequest({ method: "get", url, auth }, cls)
    }

    public post<T>(url: string, body: T, cls?: ClassConstructor<T>): Promise<T | void> {
        return this.sendRequest({ method: "post", url, data: body }, cls)
    }

    public patch<T>(url: string, body: T, cls?: ClassConstructor<T>): Promise<T | void> {
        return this.sendRequest({ method: "patch", url, data: body }, cls)
    }

    public delete<T>(url: string, cls?: ClassConstructor<T>): Promise<T | void> {
        return this.sendRequest({ method: "delete", url }, cls)
    }

    private async sendRequest<T>(config: AxiosRequestConfig, cls?: ClassConstructor<T>): Promise<T | void> {
        const response = await this.axiosInstance(config)
        if (cls)
            return plainToClass(cls, response.data)
    }
}

const baseURL = import.meta.env.VITE_API_URL as string ?? "http://localhost"
export default new Http(baseURL)
