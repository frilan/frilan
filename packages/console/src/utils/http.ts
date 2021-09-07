import axios, { AxiosBasicCredentials, AxiosInstance, AxiosRequestConfig } from "axios"
import { ClassConstructor } from "class-transformer/types/interfaces"
import { plainToClass } from "class-transformer"

/**
 * A Wrapper around axios that transforms response body into specified class.
 */
export class Http {

    private readonly axiosInstance: AxiosInstance

    public constructor(baseURL: string) {
        this.axiosInstance = axios.create({ baseURL })
        const token = localStorage.getItem("token")
        if (token)
            this.setToken(token)
    }

    public setToken(token: string): void {
        this.axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + token
        localStorage.setItem("token", token)
    }

    public clearToken(): void {
        delete this.axiosInstance.defaults.headers.common["Authorization"]
        localStorage.removeItem("token")
    }

    public get<T>(url: string, cls: ClassConstructor<T>, auth?: AxiosBasicCredentials): Promise<T> {
        return this.sendRequest({ method: "get", url, auth }, cls)
    }

    public post<T>(url: string, body: T): Promise<void>
    public post<T>(url: string, body: T, cls: ClassConstructor<T>): Promise<T>
    public post<T>(url: string, body: T, cls?: ClassConstructor<T>): Promise<T | void> {
        if (cls) return this.sendRequest({ method: "post", url, data: body }, cls)
        else return this.sendRequest({ method: "post", url, data: body })
    }

    public put<T>(url: string, body: T): Promise<void>
    public put<T>(url: string, body: T, cls: ClassConstructor<T>): Promise<T>
    public put<T>(url: string, body: T, cls?: ClassConstructor<T>): Promise<T | void> {
        if (cls) return this.sendRequest({ method: "put", url, data: body }, cls)
        else return this.sendRequest({ method: "put", url, data: body })
    }

    public patch<T>(url: string, body: T): Promise<void>
    public patch<T>(url: string, body: T, cls: ClassConstructor<T>): Promise<T>
    public patch<T>(url: string, body: T, cls?: ClassConstructor<T>): Promise<T | void> {
        if (cls) return this.sendRequest({ method: "patch", url, data: body }, cls)
        else return this.sendRequest({ method: "patch", url, data: body })
    }

    public delete(url: string): Promise<void> {
        return this.sendRequest({ method: "delete", url })
    }

    private async sendRequest(config: AxiosRequestConfig): Promise<void>
    private async sendRequest<T>(config: AxiosRequestConfig, cls: ClassConstructor<T>): Promise<T>
    private async sendRequest<T>(config: AxiosRequestConfig, cls?: ClassConstructor<T>): Promise<T | void> {
        const response = await this.axiosInstance(config)
        if (cls)
            return plainToClass(cls, response.data)
    }
}

const baseURL = import.meta.env.VITE_API_URL as string ?? "http://localhost:8080"
export default new Http(baseURL)
