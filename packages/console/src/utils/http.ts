import type { AxiosBasicCredentials, AxiosInstance, RawAxiosRequestConfig } from "axios"
import axios from "axios"
import type { ClassConstructor } from "class-transformer/types/interfaces"
import { plainToInstance } from "class-transformer"

/**
 * A wrapper around entities indicating that many entities will be returned.
 */
export class Many<T> {
    constructor(public entity: ClassConstructor<T>) {}
}

export type OneOrMany<T> = ClassConstructor<T> | Many<T>

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

    public get baseURL(): string {
        return this.axiosInstance.defaults.baseURL ?? ""
    }

    public setToken(token: string): void {
        this.axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + token
        localStorage.setItem("token", token)
    }

    public clearToken(): void {
        delete this.axiosInstance.defaults.headers.common["Authorization"]
        localStorage.removeItem("token")
    }

    public getOne<T>(url: string, cls: ClassConstructor<T>, auth?: AxiosBasicCredentials): Promise<T> {
        return this.sendRequest({ method: "get", url, auth }, cls)
    }

    public getMany<T>(url: string, cls: ClassConstructor<T>, auth?: AxiosBasicCredentials): Promise<T[]> {
        return this.sendRequest({ method: "get", url, auth }, new Many(cls))
    }

    public post<T>(url: string, body: T): Promise<void>
    public post<T>(url: string, body: Partial<T>, cls: ClassConstructor<T>): Promise<T>
    public post<T>(url: string, body: Partial<T>, cls?: ClassConstructor<T>): Promise<T | void> {
        if (cls) return this.sendRequest({ method: "post", url, data: body }, cls)
        else return this.sendRequest({ method: "post", url, data: body })
    }

    public put<T>(url: string, body: T): Promise<void>
    public put<T>(url: string, body: Partial<T>, cls: ClassConstructor<T>): Promise<T>
    public put<T>(url: string, body: Partial<T>, cls?: ClassConstructor<T>): Promise<T | void> {
        if (cls) return this.sendRequest({ method: "put", url, data: body }, cls)
        else return this.sendRequest({ method: "put", url, data: body })
    }

    public patch<T>(url: string, body: T): Promise<void>
    public patch<T>(url: string, body: Partial<T>, cls: ClassConstructor<T>): Promise<T>
    public patch<T>(url: string, body: Partial<T>, cls?: ClassConstructor<T>): Promise<T | void> {
        if (cls) return this.sendRequest({ method: "patch", url, data: body }, cls)
        else return this.sendRequest({ method: "patch", url, data: body })
    }

    public delete(url: string): Promise<void> {
        return this.sendRequest({ method: "delete", url })
    }

    private async sendRequest(config: RawAxiosRequestConfig): Promise<void>
    private async sendRequest<T>(config: RawAxiosRequestConfig, cls: ClassConstructor<T>): Promise<T>
    private async sendRequest<T>(config: RawAxiosRequestConfig, cls: Many<T>): Promise<T[]>
    private async sendRequest<T>(config: RawAxiosRequestConfig, cls: OneOrMany<T>): Promise<T | T[]>
    private async sendRequest<T>(config: RawAxiosRequestConfig, cls?: OneOrMany<T>): Promise<T | T[] | void> {
        // replace undefined with null
        for (const key in config.data)
            if (typeof config.data[key] === "undefined")
                config.data[key] = null

        const response = await this.axiosInstance(config)
        if (cls)
            return plainToInstance(cls instanceof Many ? cls.entity : cls, response.data)
    }
}

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8080"
export default new Http(String(baseURL))
