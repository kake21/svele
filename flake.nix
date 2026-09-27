{
    description = "svele - a mini SvelteKit port of projectNext";

    inputs = {
        nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    };

    outputs = { self, nixpkgs }:
        let
            systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
            forAllSystems = function:
                nixpkgs.lib.genAttrs systems (system: function nixpkgs.legacyPackages.${system});
        in
        {
            devShells = forAllSystems (pkgs: {
                default = pkgs.mkShell {
                    packages = with pkgs; [
                        nodejs_24

                        # The whole reason this flake exists.
                        #
                        # Prisma ships prebuilt engine binaries through npm. They are dynamically
                        # linked against an FHS layout that does not exist on NixOS, so they fail
                        # to execute with a confusing ENOENT on the *interpreter*, not the file.
                        #
                        # Prisma 7 narrows this to a single binary: with a driver adapter
                        # (PrismaPg, which svele uses) there is no native query engine at runtime
                        # at all, and schema parsing moved to WASM. Only `prisma db push`,
                        # `migrate` and friends still need a native schema-engine.
                        #
                        # This package ships exactly that one binary and carries a setup-hook that
                        # exports PRISMA_SCHEMA_ENGINE_BINARY, so simply listing it here is the
                        # entire fix - no env block, no patchelf, no nix-ld.
                        prisma-engines

                        # psql, pg_dump - for poking at the database from the host.
                        postgresql_16
                    ];

                    shellHook = ''
                        # docker-compose.yml publishes Postgres on 5433 to stay clear of
                        # projectNext's 5432. Inside the compose network the host is `db:5432`,
                        # which is what .env carries - hence a different value here rather than
                        # sourcing that file.
                        export DB_URI="''${DB_URI:-postgresql://svele:svele@localhost:5433/svele}"
                        export LOG_LEVEL="''${LOG_LEVEL:-info}"
                        export PASSWORD_ENCRYPTION_KEY="''${PASSWORD_ENCRYPTION_KEY:-svele-dev-pepper-change-me}"

                        echo "svele dev shell"
                        echo "  node          $(node --version)"
                        echo "  schema-engine $(basename $(dirname $(dirname $PRISMA_SCHEMA_ENGINE_BINARY)))"
                        echo
                        echo "  docker compose up db     start Postgres only (port 5433)"
                        echo "  npm ci                   install into ./node_modules"
                        echo "  npx prisma db push       sync schema"
                        echo "  npm run db:seed          seed 25 quotes"
                        echo "  npm run dev              vite on http://localhost:5173"
                        echo
                        echo "  Do not run the full 'docker compose up' at the same time -"
                        echo "  the svele container publishes 5173 too."
                    '';
                };
            });

            packages = forAllSystems (pkgs: rec {
                default = svele;

                # A production build: `nix build` produces the adapter-node server.
                svele = pkgs.buildNpmPackage (finalAttrs: {
                    pname = "svele";
                    version = "0.1.0";

                    src = self;

                    npmDepsHash = "sha256-FmRMgxTdUowR99xO9Bto8ikcdswAOZRr5uavKie7bWE=";

                    nativeBuildInputs = [ pkgs.prisma-engines ];

                    # Two things must exist before vite build can run: the generated prisma
                    # client (it is generated, not vendored) and .svelte-kit/tsconfig.json,
                    # which svelte-kit sync produces and which tsconfig.json extends.
                    # Order matters. Prisma 7's prisma-client generator emits TypeScript and reads
                    # tsconfig.json to do it - and tsconfig.json extends .svelte-kit/tsconfig.json,
                    # which only exists once svelte-kit sync has run. Generating first fails with
                    # a misleading "File './.svelte-kit/tsconfig.json' not found".
                    preBuild = ''
                        npx svelte-kit sync
                        npx prisma generate
                    '';

                    # buildNpmPackage's default install expects a `bin` in package.json. This is a
                    # server, so ship adapter-node's output plus the runtime dependencies and a
                    # launcher.
                    installPhase = ''
                        runHook preInstall

                        # adapter-node leaves a handful of imports external rather than bundling
                        # them, so node_modules has to ship - but only the production half. The
                        # server bundle needs @prisma/*, zod, zod-form-data and @sveltejs/kit;
                        # the last of those is why kit sits in dependencies rather than
                        # devDependencies. svelte itself is NOT needed - the compiler output is
                        # self-contained for SSR.
                        #
                        # This still lands around 360MB, and that is Prisma, not packaging:
                        # @prisma/client 7.x declares the whole `prisma` CLI as a runtime
                        # dependency, dragging in effect, @electric-sql and typescript. prune
                        # keeps them because the dependency graph genuinely asks for them.
                        npm prune --omit=dev --no-save

                        mkdir -p $out/lib/svele
                        cp -r build package.json $out/lib/svele/
                        cp -r node_modules $out/lib/svele/node_modules

                        mkdir -p $out/bin
                        makeWrapper ${pkgs.nodejs_24}/bin/node $out/bin/svele \
                            --add-flags "$out/lib/svele/build/index.js"

                        runHook postInstall
                    '';

                    meta = {
                        description = "A mini SvelteKit port of projectNext";
                        homepage = "https://github.com/kake21/svele";
                        mainProgram = "svele";
                    };
                });
            });

            apps = forAllSystems (pkgs: {
                default = {
                    type = "app";
                    program = "${self.packages.${pkgs.stdenv.hostPlatform.system}.svele}/bin/svele";
                };
            });

            formatter = forAllSystems (pkgs: pkgs.nixfmt-rfc-style);
        };
}
