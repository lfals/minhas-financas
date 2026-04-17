import "server-only"

import { SalariesRepository } from "@/modules/salaries/infrastructure/salaries-repository"

const repository = new SalariesRepository()

export async function getSalaryUseCase(clerkUserId: string) {
  return repository.getByUserId(clerkUserId)
}
