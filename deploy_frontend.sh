#!/bin/bash

readJson() {
  UNAMESTR=`uname`
  if [[ "$UNAMESTR" == 'Linux' ]]; then
    SED_EXTENDED='-r'
  elif [[ "$UNAMESTR" == 'Darwin' ]]; then
    SED_EXTENDED='-E'
  fi;

  VALUE=`grep -m 1 "\"${2}\"" ${1} | sed ${SED_EXTENDED} 's/^ *//;s/.*: *"//;s/",?//'`

  if [ ! "$VALUE" ]; then
    echo "Error: Cannot find \"${2}\" in ${1}" >&2;
    exit 1;
  else
    echo $VALUE ;
  fi;
}

altera_href() {

    DEFAULT_PATH="\/web\/batimentos-web\/"

    if [ -f batimentos-fetais-web/config/env.json ]; then
      APPLICATION_PATH=`readJson batimentos-fetais-web/config/env.json APPLICATION_PATH` || exit 1;
    else
      echo "$(date +'%d/%m/%Y %H:%M'): Não existe env.json para carregar. O arquivo de ambiente default é para producao..." | tee -a batimentos-fetais_web-deploy.log
      APPLICATION_PATH="\/batimentos-fetais\/batimentos-fetais-web\/"
    fi

    sed -i 's/'"$DEFAULT_PATH"'/'"$APPLICATION_PATH"'/g' batimentos-fetais-web/index.html

    echo "$(date +'%d/%m/%Y %H:%M'): Alterado HREF de produção" | tee -a batimentos-fetais_web-deploy.log
}

menu_env_override(){
    ambiente_valor="$1"
    title="Sobrescrever .env?"
    prompt="Selecione: "
    options=("Sim" "Nao")
    echo "$title"
    PS3="$prompt"
    select opt in "${options[@]}"; do
        case "$REPLY" in
            1 )
                echo "$(date +'%d/%m/%Y %H:%M'): Sobrescrever .env" | tee -a batimentos-fetais_web-deploy.log

                if [ "$ambiente_valor" == 1 ]; then
                    # Entra caso ambiente seja desenvolvimento
                    yes | cp env.dev.json batimentos-fetais-web/config/env.json

                    altera_href

                    echo "$(date +'%d/%m/%Y %H:%M'): alterando .env para desenvolvimento..." | tee -a batimentos-fetais_web-deploy.log

                elif [ "$ambiente_valor" == 2 ]; then
                    # Entra caso ambiente seja homolog
                    # Editar e mover .env.homolog.$contexto para a pasta /batimentos-fetais/batimentos-fetais-web-api/project
                    yes | cp env.homolog.json batimentos-fetais-web/config/env.json
                    altera_href

                    echo "$(date +'%d/%m/%Y %H:%M'): alterando .env para homologacao..." | tee -a batimentos-fetais_web-deploy.log

                elif [ "$ambiente_valor" == 3 ]; then
                    # Entra caso ambiente seja producao
                    # Editar e mover .env.prod.$contexto para a pasta /batimentos-fetais/batimentos-fetais-web-api/project
                    yes | cp env.prod.json batimentos-fetais-web/config/env.json

                    altera_href

                    echo "$(date +'%d/%m/%Y %H:%M'): alterando .env para producao..." | tee -a batimentos-fetais_web-deploy.log

                fi
                return
            ;;
            2 )
                echo "$(date +'%d/%m/%Y %H:%M'): Não sobrescrever .env" | tee -a batimentos-fetais_web-deploy.log
                if [ -f tmp/env.bkp.json ]; then
                    cp tmp/env.bkp.json batimentos-fetais-web/config/env.json
                else
                    echo "$(date +'%d/%m/%Y %H:%M'): Não existe .env salvo. O arquivo de ambiente default é para producao..." | tee -a batimentos-fetais_web-deploy.log
                    cp env.json batimentos-fetais-web/config/env.json
                fi

                altera_href
                return
            ;;
            * )
                echo "opcao invalida. Tente novamente.";
                continue
            ;;
        esac
    done
    return
}


menu_env(){
    title="Opcoes de ambiente"
    prompt="Selecione:"
    options=("Desenvolvimento" "Homologacao" "Producao")
    echo "$title"
    PS3="$prompt"
    select opt in "${options[@]}" "Sair"; do
        case "$REPLY" in
            1 )
              echo "$(date +'%d/%m/%Y %H:%M'): Selecionado ambiente $opt opcao $REPLY" | tee -a batimentos-fetais_web-deploy.log
              menu_contexto $opt $REPLY
            ;;
            2 )
              echo "$(date +'%d/%m/%Y %H:%M'): Selecionado ambiente $opt opcao $REPLY" | tee -a batimentos-fetais_web-deploy.log
              menu_contexto $opt $REPLY
            ;;
            3 )
              echo "$(date +'%d/%m/%Y %H:%M'): Selecionado ambiente $opt opcao $REPLY" | tee -a batimentos-fetais_web-deploy.log
              menu_contexto $opt $REPLY
            ;;
            $(( ${#options[@]}+1 )) )
              clear;
              echo "Goodbye!";
              exit
            ;;
            *)
              echo "opcao invalida. Tente novamente.";
              continue
            ;;
         esac
     done
     return
}

menu_contexto(){
    ambiente_texto="$1"
    ambiente_valor="$2"

    if [ ! -d tmp ]; then
      mkdir tmp
    fi

    if [ ! -d /batimentos-fetais/ ]; then
      mkdir /batimentos-fetais/
    fi

    # Salva .env
    if [ -d /batimentos-fetais/batimentos-fetais-web ]; then
      cp /batimentos-fetais/batimentos-fetais-web/config/env.json tmp/env.bkp.json

      echo "$(date +'%d/%m/%Y %H:%M'): Arquivo de configuracao de ambiente salvo..." | tee -a batimentos-fetais_web-deploy.log
    fi

    rm -rf /batimentos-fetais/batimentos-fetais-web/

    echo "$(date +'%d/%m/%Y %H:%M'): removendo a pasta existente..." | tee -a batimentos-fetais_web-deploy.log

    unzip -d batimentos-fetais-web batimentos-fetais-web.zip

    echo "$(date +'%d/%m/%Y %H:%M'): descompactando pasta da aplicação..." | tee -a batimentos-fetais_web-deploy.log

    menu_env_override $ambiente_valor

    mv batimentos-fetais-web /batimentos-fetais/

    apachectl restart
    echo "$(date +'%d/%m/%Y %H:%M'): Deploy do batimentos-fetais-web finalizado. Ambiente: $ambiente_texto." | tee -a batimentos-fetais_web-deploy.log

    cp batimentos-fetais_web-deploy.log /batimentos-fetais/batimentos-fetais-web/
    exit

}
menu_env
