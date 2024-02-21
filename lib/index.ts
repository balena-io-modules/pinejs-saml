import type { sbvrUtils } from '@balena/pinejs';

const modelText: string = `
Vocabulary: Auth

Term: certificate
	Concept Type: Text (Type)
Term: company name
	Concept Type: Short Text (Type)
Term: display name
	Concept Type: Short Text (Type)
Term: email
	Concept Type: Short Text (Type)
Term: entry point
	Concept Type: Short Text (Type)
Term: issuer
	Concept Type: Short Text (Type)
Term: remote id
	Concept Type: Short Text (Type)

Fact type: identity provider has certificate
	Necessity: each identity provider has exactly one certificate.
Fact type: identity provider has company name
	Necessity: each identity provider has exactly one company name.
	Necessity: each company name is of exactly one identity provider.
Fact type: identity provider has entry point
	Necessity: each identity provider has exactly one entry point.
Fact type: identity provider has issuer
	Necessity: each identity provider has exactly one issuer.
	Necessity: each issuer is of exactly one identity provider.
Fact type: identity provider requires signed authn response

Fact type: saml account belongs to user
	Synonymous Form: user owns saml account
	Necessity: each saml account belongs to exactly one user.
	Necessity: each user owns at most one saml account.
Fact type: saml account was generated by identity provider
	Necessity: each saml account was generated by exactly one identity provider.
Fact type: saml account has remote id
	Necessity: each saml account has exactly one remote id.
Fact type: saml account has display name
	Necessity: each saml account has at most one display name.
Fact type: saml account has email
	Necessity: each saml account has at most one email.
`;

export const samlModel = {
	apiRoot: 'Auth',
	modelText,
	migrations: {
		'12.0.0-saml-add-saml-account': `
			CREATE TABLE IF NOT EXISTS "saml account" (
				"created at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
			,	"modified at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
			,	"id" SERIAL NOT NULL PRIMARY KEY
			,	"belongs to-user" INTEGER NOT NULL UNIQUE
			,	"was generated by-identity provider" INTEGER NOT NULL
			,	"remote id" VARCHAR(255) NOT NULL
			,	"display name" VARCHAR(255) NULL
			,	"email" TEXT NULL
			,	FOREIGN KEY ("belongs to-user") REFERENCES "user" ("id")
			,	FOREIGN KEY ("was generated by-identity provider") REFERENCES "identity provider" ("id")
			);
			
			DO
			$$
			BEGIN
			IF NOT EXISTS(
				SELECT 1
				FROM "information_schema"."triggers"
				WHERE "event_object_table" = 'saml account'
				AND "trigger_name" = 'saml account_trigger_update_modified_at'
			) THEN
				CREATE TRIGGER "saml account_trigger_update_modified_at"
				BEFORE UPDATE ON "saml account"
				FOR EACH ROW
				EXECUTE PROCEDURE "trigger_update_modified_at"();
			END IF;
			END;
			$$
		`,
		'12.0.1-saml-add-identity-provider': `
			CREATE TABLE IF NOT EXISTS "identity provider membership" (
				"created at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
			,	"modified at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
			,	"organization" INTEGER NOT NULL
			,	"is authorized by-identity provider" INTEGER NOT NULL
			,	"id" SERIAL NOT NULL PRIMARY KEY
			,	"grants access to-team" INTEGER NOT NULL
			,	FOREIGN KEY ("organization") REFERENCES "organization" ("id")
			,	FOREIGN KEY ("is authorized by-identity provider") REFERENCES "identity provider" ("id")
			,	FOREIGN KEY ("grants access to-team") REFERENCES "team" ("id")
			,	UNIQUE("organization", "is authorized by-identity provider")
			);
			
			DO
			$$
			BEGIN
			IF NOT EXISTS(
				SELECT 1
				FROM "information_schema"."triggers"
				WHERE "event_object_table" = 'identity provider membership'
				AND "trigger_name" = 'identity provider membership_trigger_update_modified_at'
			) THEN
				CREATE TRIGGER "identity provider membership_trigger_update_modified_at"
				BEFORE UPDATE ON "identity provider membership"
				FOR EACH ROW
				EXECUTE PROCEDURE "trigger_update_modified_at"();
			END IF;
			END;
			$$
		`,
	},
} satisfies sbvrUtils.ExecutableModel;
