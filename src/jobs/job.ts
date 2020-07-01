export interface Job {
    run(): Promise<void>;
}
