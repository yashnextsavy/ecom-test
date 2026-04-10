import { Module } from "@medusajs/framework/utils"
import ContactRequestService from "./service"

export const CONTACT_REQUEST_MODULE = "contactRequest"

export default Module(CONTACT_REQUEST_MODULE, {
  service: ContactRequestService,
})
