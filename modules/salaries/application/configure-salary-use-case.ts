import "server-only"

import { SalariesRepository } from "@/modules/salaries/infrastructure/salaries-repository"
import type { ConfigureSalaryCommand } from "@/modules/salaries/domain/types"

const repository = new SalariesRepository()

export async function configureSalaryUseCase(command: ConfigureSalaryCommand) {
  return repository.configure(command)
}
